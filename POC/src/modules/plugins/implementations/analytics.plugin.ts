import { Logger } from '@nestjs/common';
import { Plugin } from '../plugin.decorator';
import { LogisticsPlugin } from '../plugin.interface';

@Plugin()
export class AnalyticsPlugin implements LogisticsPlugin {
  readonly name = 'AnalyticsPlugin';
  private readonly logger = new Logger(AnalyticsPlugin.name);
  private shipmentsCreated = 0;

  onShipmentCreated(): void {
    this.shipmentsCreated += 1;
    this.logger.debug(`[analytics-plugin] running total: ${this.shipmentsCreated}`);
  }
}
