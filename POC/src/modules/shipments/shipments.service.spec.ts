import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ShipmentsService } from './shipments.service';
import { ShipmentsRepository } from './shipments.repository';
import { TrackingStreamService } from './tracking-stream.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { QueueService } from '../../queues/queue.service';
import { InvalidStateTransitionException } from '../../common/exceptions/business.exception';
import { ShipmentStatus } from '../../shared/enums';

describe('ShipmentsService (state machine)', () => {
  let service: ShipmentsService;
  let repository: any;
  let trackingStream: TrackingStreamService;

  const makeShipment = (status: ShipmentStatus) => ({
    id: 'ship-1',
    shipmentNumber: 'SHP-2026-000001',
    status,
    trackingEvents: [] as unknown[],
    deliveredAt: null as Date | null,
    save: jest.fn().mockResolvedValue(undefined),
  });

  beforeEach(async () => {
    repository = { findById: jest.fn(), update: jest.fn(), count: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShipmentsService,
        { provide: ShipmentsRepository, useValue: repository },
        TrackingStreamService,
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: RedisService, useValue: { del: jest.fn(), delByPattern: jest.fn() } },
        { provide: QueueService, useValue: {} },
      ],
    }).compile();

    service = module.get(ShipmentsService);
    trackingStream = module.get(TrackingStreamService);
  });

  it('rejects an illegal status transition (DELIVERED -> IN_TRANSIT)', async () => {
    repository.findById!.mockResolvedValue(makeShipment(ShipmentStatus.DELIVERED) as any);
    await expect(
      service.addTrackingEvent('ship-1', { status: ShipmentStatus.IN_TRANSIT }),
    ).rejects.toBeInstanceOf(InvalidStateTransitionException);
  });

  it('accepts a legal transition and publishes a live update', async () => {
    const shipment = makeShipment(ShipmentStatus.PICKED_UP);
    repository.findById!.mockResolvedValue(shipment as any);
    const publishSpy = jest.spyOn(trackingStream, 'publish');

    await service.addTrackingEvent('ship-1', {
      status: ShipmentStatus.IN_TRANSIT,
      description: 'On the road',
    });

    expect(shipment.status).toBe(ShipmentStatus.IN_TRANSIT);
    expect(shipment.save).toHaveBeenCalled();
    expect(publishSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: ShipmentStatus.IN_TRANSIT }),
    );
  });

  it('stamps deliveredAt when the shipment is delivered', async () => {
    const shipment = makeShipment(ShipmentStatus.OUT_FOR_DELIVERY);
    repository.findById!.mockResolvedValue(shipment as any);

    await service.addTrackingEvent('ship-1', { status: ShipmentStatus.DELIVERED });
    expect(shipment.deliveredAt).toBeInstanceOf(Date);
  });
});
