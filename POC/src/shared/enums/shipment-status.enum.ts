/** Lifecycle states for a shipment. */
export enum ShipmentStatus {
  CREATED = 'CREATED',
  ASSIGNED = 'ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  EXCEPTION = 'EXCEPTION',
}

/** Allowed forward transitions — enforced by the ShipmentService. */
export const SHIPMENT_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  [ShipmentStatus.CREATED]: [ShipmentStatus.ASSIGNED, ShipmentStatus.CANCELLED],
  [ShipmentStatus.ASSIGNED]: [ShipmentStatus.PICKED_UP, ShipmentStatus.CANCELLED],
  [ShipmentStatus.PICKED_UP]: [ShipmentStatus.IN_TRANSIT, ShipmentStatus.EXCEPTION],
  [ShipmentStatus.IN_TRANSIT]: [ShipmentStatus.OUT_FOR_DELIVERY, ShipmentStatus.EXCEPTION],
  [ShipmentStatus.OUT_FOR_DELIVERY]: [ShipmentStatus.DELIVERED, ShipmentStatus.EXCEPTION],
  [ShipmentStatus.DELIVERED]: [],
  [ShipmentStatus.CANCELLED]: [],
  [ShipmentStatus.EXCEPTION]: [ShipmentStatus.IN_TRANSIT, ShipmentStatus.CANCELLED],
};
