import { SetMetadata, Injectable, applyDecorators } from '@nestjs/common';

export const PLUGIN_METADATA = 'logistics:plugin';

/**
 * Marks a provider as a discoverable plugin. Combines `@Injectable()` (so Nest
 * instantiates it) with metadata the `DiscoveryService` scans for.
 *
 * @example  @Plugin() class AuditPlugin implements LogisticsPlugin { ... }
 */
export const Plugin = (): ClassDecorator =>
  applyDecorators(Injectable(), SetMetadata(PLUGIN_METADATA, true));
