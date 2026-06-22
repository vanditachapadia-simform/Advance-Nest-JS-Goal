import { Module } from '@nestjs/common';
import { ShipmentEventListener } from './listeners/shipment.listener';
import { UserEventListener } from './listeners/user.listener';

/**
 * Registers all domain event listeners. `EventEmitterModule.forRoot()` itself is
 * configured once globally in AppModule; this module just groups the listeners.
 */
@Module({
  providers: [ShipmentEventListener, UserEventListener],
})
export class EventsModule {}
