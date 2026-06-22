import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, ModuleRef, Reflector } from '@nestjs/core';
import { OnEvent } from '@nestjs/event-emitter';
import { PLUGIN_METADATA } from './plugin.decorator';
import { LogisticsPlugin } from './plugin.interface';
import { EVENTS } from '../../shared/constants';
import { ShipmentCreatedEvent } from '../../events/event-payloads';

/**
 * Plugin host demonstrating the DISCOVERY SERVICE + ModuleRef.
 *
 *  - On bootstrap (`OnModuleInit`), scans every provider in the container for the
 *    `@Plugin()` metadata and collects the matching instances — no manual list.
 *  - Calls each plugin's optional `onInit()`.
 *  - Bridges the `shipment.created` domain event to every plugin's hook.
 *  - `ModuleRef.resolve` is used to demonstrate runtime resolution of a plugin
 *    by type when one is needed imperatively.
 */
@Injectable()
export class PluginExplorer implements OnModuleInit {
  private readonly logger = new Logger(PluginExplorer.name);
  private readonly plugins: LogisticsPlugin[] = [];

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly reflector: Reflector,
    private readonly moduleRef: ModuleRef,
  ) {}

  async onModuleInit(): Promise<void> {
    const providers = this.discovery.getProviders();
    for (const wrapper of providers) {
      if (!wrapper.metatype || !wrapper.instance) continue;
      const isPlugin = this.reflector.get<boolean>(PLUGIN_METADATA, wrapper.metatype);
      if (isPlugin) {
        this.plugins.push(wrapper.instance as LogisticsPlugin);
      }
    }

    this.logger.log(
      `Discovered ${this.plugins.length} plugin(s): ${this.plugins.map((p) => p.name).join(', ')}`,
    );
    await Promise.all(this.plugins.map((p) => p.onInit?.()));
  }

  @OnEvent(EVENTS.SHIPMENT_CREATED, { async: true })
  async onShipmentCreated(event: ShipmentCreatedEvent): Promise<void> {
    await Promise.all(
      this.plugins.map((p) =>
        p.onShipmentCreated?.({
          shipmentId: event.shipmentId,
          shipmentNumber: event.shipmentNumber,
        }),
      ),
    );
  }

  listPlugins(): { name: string }[] {
    return this.plugins.map((p) => ({ name: p.name }));
  }

  /** Demonstrates ModuleRef runtime resolution by class token. */
  async resolvePlugin<T>(type: new (...args: any[]) => T): Promise<T> {
    return this.moduleRef.resolve(type, undefined, { strict: false });
  }
}
