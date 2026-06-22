import { Logger } from '@nestjs/common';
import { Plugin } from '../plugin.decorator';
import { LogisticsPlugin } from '../plugin.interface';

@Plugin()
export class AuditPlugin implements LogisticsPlugin {
  readonly name = 'AuditPlugin';
  private readonly logger = new Logger(AuditPlugin.name);

  onInit(): void {
    this.logger.log('Audit plugin initialised');
  }

  onShipmentCreated(payload: { shipmentId: string; shipmentNumber: string }): void {
    this.logger.log(`[audit-plugin] shipment ${payload.shipmentNumber} created`);
  }
}
