import { Logger } from '@nestjs/common';
import { Plugin } from '../plugin.decorator';
import { LogisticsPlugin } from '../plugin.interface';

@Plugin()
export class NotificationPlugin implements LogisticsPlugin {
  readonly name = 'NotificationPlugin';
  private readonly logger = new Logger(NotificationPlugin.name);

  onShipmentCreated(payload: { shipmentId: string; shipmentNumber: string }): void {
    this.logger.log(`[notification-plugin] would notify subscribers of ${payload.shipmentNumber}`);
  }
}
