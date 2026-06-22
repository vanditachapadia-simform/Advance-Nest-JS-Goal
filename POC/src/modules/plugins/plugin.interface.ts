/**
 * Contract every logistics plugin implements. The PluginExplorer discovers all
 * providers tagged with `@Plugin()` at startup and invokes the relevant hook
 * when a domain event fires — no central registration list to maintain.
 */
export interface LogisticsPlugin {
  /** Unique, human-readable plugin name. */
  readonly name: string;

  /** Called once during bootstrap so the plugin can initialise resources. */
  onInit?(): void | Promise<void>;

  /** Invoked when a shipment is created. */
  onShipmentCreated?(payload: { shipmentId: string; shipmentNumber: string }): void | Promise<void>;
}
