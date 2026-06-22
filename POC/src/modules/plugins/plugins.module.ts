import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { PluginExplorer } from './plugins.service';
import { PluginsController } from './plugins.controller';
import { AuditPlugin } from './implementations/audit.plugin';
import { AnalyticsPlugin } from './implementations/analytics.plugin';
import { NotificationPlugin } from './implementations/notification.plugin';

/**
 * `DiscoveryModule` exposes the `DiscoveryService` used to auto-detect plugins.
 * Adding a new plugin is as simple as creating a `@Plugin()` class and listing
 * it here — the explorer finds and wires it automatically.
 */
@Module({
  imports: [DiscoveryModule],
  controllers: [PluginsController],
  providers: [PluginExplorer, AuditPlugin, AnalyticsPlugin, NotificationPlugin],
  exports: [PluginExplorer],
})
export class PluginsModule {}
