import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENTS } from '../../shared/constants';
import { QueueService } from '../../queues/queue.service';
import {
  ShipmentCreatedEvent,
  ShipmentDeliveredEvent,
  ShipmentUpdatedEvent,
} from '../event-payloads';

/**
 * Reacts to shipment domain events. Decouples side-effects (emails, queue jobs)
 * from the ShipmentService — the service just emits, listeners handle the rest.
 * `async: true` runs listeners off the main call stack.
 */
@Injectable()
export class ShipmentEventListener {
  private readonly logger = new Logger(ShipmentEventListener.name);

  constructor(private readonly queueService: QueueService) {}

  @OnEvent(EVENTS.SHIPMENT_CREATED, { async: true })
  handleCreated(event: ShipmentCreatedEvent): void {
    this.logger.log(`[event] shipment.created ${event.shipmentNumber}`);
  }

  @OnEvent(EVENTS.SHIPMENT_UPDATED, { async: true })
  async handleUpdated(event: ShipmentUpdatedEvent): Promise<void> {
    this.logger.log(`[event] shipment.updated ${event.shipmentNumber} -> ${event.status}`);
  }

  @OnEvent(EVENTS.SHIPMENT_DELIVERED, { async: true })
  async handleDelivered(event: ShipmentDeliveredEvent): Promise<void> {
    this.logger.log(`[event] shipment.delivered ${event.shipmentNumber}`);
    if (event.ownerEmail) {
      await this.queueService.enqueueDeliveryNotificationEmail({
        email: event.ownerEmail,
        shipmentNumber: event.shipmentNumber,
      });
    }
  }
}
