/**
 * Centralised string constants. Keeping these in one place avoids typo-driven
 * bugs (e.g. emitting `shipment.created` but listening for `shipment.create`).
 */

/** BullMQ queue names. */
export const QUEUE = {
  EMAIL: 'email',
  REPORT: 'report',
  DOCUMENT: 'document',
} as const;

/** Domain event names emitted via EventEmitter2. */
export const EVENTS = {
  SHIPMENT_CREATED: 'shipment.created',
  SHIPMENT_UPDATED: 'shipment.updated',
  SHIPMENT_DELIVERED: 'shipment.delivered',
  SHIPMENT_TRACKING_ADDED: 'shipment.tracking.added',
  USER_CREATED: 'user.created',
  CARRIER_CREATED: 'carrier.created',
} as const;

/** Injection tokens for custom / async providers. */
export const TOKENS = {
  REDIS_CLIENT: 'REDIS_CLIENT',
  WINSTON_LOGGER: 'WINSTON_LOGGER',
  NOTIFICATION_OPTIONS: 'NOTIFICATION_OPTIONS',
  USER_SERVICE_CLIENT: 'USER_SERVICE_CLIENT',
  SHIPMENT_SERVICE_CLIENT: 'SHIPMENT_SERVICE_CLIENT',
  NOTIFICATION_SERVICE_CLIENT: 'NOTIFICATION_SERVICE_CLIENT',
  PLUGIN: 'PLUGIN',
} as const;

/** Microservice message/event patterns shared between gateway and services. */
export const PATTERNS = {
  USER_FIND_BY_ID: { cmd: 'user.findById' },
  USER_VALIDATE: { cmd: 'user.validate' },
  SHIPMENT_GET_SUMMARY: { cmd: 'shipment.summary' },
  NOTIFICATION_SEND: { cmd: 'notification.send' },
  // Event patterns (fire-and-forget)
  EVENT_SHIPMENT_CREATED: 'event.shipment.created',
  EVENT_USER_CREATED: 'event.user.created',
} as const;
