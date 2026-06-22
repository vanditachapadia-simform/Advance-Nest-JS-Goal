import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Types } from 'mongoose';
import { ShipmentsRepository } from './shipments.repository';
import { TrackingStreamService } from './tracking-stream.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { AddTrackingEventDto } from './dto/add-tracking-event.dto';
import { QueryShipmentDto } from './dto/query-shipment.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import {
  InvalidStateTransitionException,
  ResourceNotFoundException,
} from '../../common/exceptions/business.exception';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { QueueService } from '../../queues/queue.service';
import { SHIPMENT_TRANSITIONS, ShipmentStatus } from '../../shared/enums';
import { EVENTS as EVENT_NAMES } from '../../shared/constants';
import {
  ShipmentCreatedEvent,
  ShipmentDeliveredEvent,
  ShipmentUpdatedEvent,
} from '../../events/event-payloads';
import { Shipment, ShipmentDocument } from './schemas/shipment.schema';

@Injectable()
export class ShipmentsService {
  private readonly logger = new Logger(ShipmentsService.name);
  private readonly cachePrefix = 'shipment';

  constructor(
    private readonly shipmentsRepository: ShipmentsRepository,
    private readonly trackingStream: TrackingStreamService,
    private readonly eventEmitter: EventEmitter2,
    private readonly redis: RedisService,
    private readonly queueService: QueueService,
  ) {}

  async create(dto: CreateShipmentDto, userId: string, correlationId?: string): Promise<Shipment> {
    const shipmentNumber = await this.generateShipmentNumber();
    const shipment = (await this.shipmentsRepository.create({
      shipmentNumber,
      origin: dto.origin,
      destination: dto.destination,
      carrierId: dto.carrierId ? new Types.ObjectId(dto.carrierId) : null,
      createdBy: new Types.ObjectId(userId),
      weightKg: dto.weightKg ?? 0,
      estimatedDeliveryAt: dto.estimatedDeliveryAt ? new Date(dto.estimatedDeliveryAt) : null,
      status: dto.carrierId ? ShipmentStatus.ASSIGNED : ShipmentStatus.CREATED,
      trackingEvents: [
        {
          status: dto.carrierId ? ShipmentStatus.ASSIGNED : ShipmentStatus.CREATED,
          description: 'Shipment created',
        } as never,
      ],
    })) as ShipmentDocument;

    this.eventEmitter.emit(
      EVENT_NAMES.SHIPMENT_CREATED,
      new ShipmentCreatedEvent(shipment.id, shipment.shipmentNumber, userId, correlationId),
    );
    this.logger.log(`Shipment created: ${shipment.shipmentNumber}`);
    return shipment;
  }

  async findAll(query: QueryShipmentDto): Promise<PaginatedResult<Shipment>> {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.carrierId) filter.carrierId = new Types.ObjectId(query.carrierId);

    const { items, total } = await this.shipmentsRepository.paginate(filter, {
      skip: query.skip,
      limit: query.limit,
      sort: { createdAt: -1 },
    });
    return PaginatedResult.build(items, total, query.page, query.limit);
  }

  async findById(id: string): Promise<Shipment> {
    const shipment = await this.shipmentsRepository.findById(id);
    if (!shipment) throw new ResourceNotFoundException('Shipment', id);
    return shipment;
  }

  async assignCarrier(id: string, carrierId: string): Promise<Shipment> {
    const shipment = await this.shipmentsRepository.update(id, {
      carrierId: new Types.ObjectId(carrierId),
      status: ShipmentStatus.ASSIGNED,
    });
    if (!shipment) throw new ResourceNotFoundException('Shipment', id);
    await this.invalidateCache(id);
    return shipment;
  }

  /**
   * Appends a tracking event, enforcing the allowed state machine. Publishes a
   * live update (SSE/WS), emits domain events, and queues notifications.
   */
  async addTrackingEvent(id: string, dto: AddTrackingEventDto): Promise<Shipment> {
    const shipment = (await this.shipmentsRepository.findById(id)) as ShipmentDocument | null;
    if (!shipment) throw new ResourceNotFoundException('Shipment', id);

    const allowed = SHIPMENT_TRANSITIONS[shipment.status] ?? [];
    if (shipment.status !== dto.status && !allowed.includes(dto.status)) {
      throw new InvalidStateTransitionException(shipment.status, dto.status);
    }

    shipment.trackingEvents.push({
      status: dto.status,
      description: dto.description,
      location: dto.location,
      lat: dto.lat,
      lng: dto.lng,
    } as never);
    shipment.status = dto.status;
    if (dto.status === ShipmentStatus.DELIVERED) {
      shipment.deliveredAt = new Date();
    }
    await shipment.save();
    await this.invalidateCache(id);

    const update = {
      shipmentId: shipment.id,
      shipmentNumber: shipment.shipmentNumber,
      status: dto.status,
      description: dto.description,
      location: dto.location,
      lat: dto.lat,
      lng: dto.lng,
      timestamp: new Date().toISOString(),
    };
    // Push to live subscribers (SSE + WebSocket).
    this.trackingStream.publish(update);

    // Emit the appropriate domain event.
    if (dto.status === ShipmentStatus.DELIVERED) {
      this.eventEmitter.emit(
        EVENT_NAMES.SHIPMENT_DELIVERED,
        new ShipmentDeliveredEvent(shipment.id, shipment.shipmentNumber, shipment.deliveredAt!),
      );
    } else {
      this.eventEmitter.emit(
        EVENT_NAMES.SHIPMENT_UPDATED,
        new ShipmentUpdatedEvent(shipment.id, shipment.shipmentNumber, dto.status),
      );
    }
    return shipment;
  }

  async attachDocument(id: string, documentId: Types.ObjectId): Promise<void> {
    await this.shipmentsRepository.update(id, { $push: { documents: documentId } });
    await this.invalidateCache(id);
  }

  /** Status breakdown used by the analytics dashboard. */
  async getStatusSummary(): Promise<Record<string, number>> {
    const rows = await this.shipmentsRepository.countByStatus();
    return rows.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {} as Record<string, number>);
  }

  getLiveStream(shipmentId: string) {
    return this.trackingStream.forShipment(shipmentId);
  }

  private async invalidateCache(id: string): Promise<void> {
    await this.redis.del(`${this.cachePrefix}:/api/v1/shipments/${id}`);
    await this.redis.delByPattern(`${this.cachePrefix}:*`);
  }

  private async generateShipmentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.shipmentsRepository.count();
    const seq = String(count + 1).padStart(6, '0');
    return `SHP-${year}-${seq}`;
  }
}
