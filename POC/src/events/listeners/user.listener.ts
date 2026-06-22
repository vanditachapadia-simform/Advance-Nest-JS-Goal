import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENTS } from '../../shared/constants';
import { QueueService } from '../../queues/queue.service';
import { CarrierCreatedEvent, UserCreatedEvent } from '../event-payloads';

/**
 * Handles user/carrier creation events — primarily fanning out welcome emails
 * onto the email queue. Demonstrates a single listener class subscribing to
 * multiple event names.
 */
@Injectable()
export class UserEventListener {
  private readonly logger = new Logger(UserEventListener.name);

  constructor(private readonly queueService: QueueService) {}

  @OnEvent(EVENTS.USER_CREATED, { async: true })
  async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    this.logger.log(`[event] user.created ${event.email}`);
    await this.queueService.enqueueWelcomeEmail({
      email: event.email,
      firstName: event.firstName,
    });
  }

  @OnEvent(EVENTS.CARRIER_CREATED, { async: true })
  handleCarrierCreated(event: CarrierCreatedEvent): void {
    this.logger.log(`[event] carrier.created ${event.name}`);
  }
}
