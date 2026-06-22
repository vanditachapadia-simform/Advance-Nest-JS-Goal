/**
 * Strongly-typed event payloads. Using classes (not loose objects) gives
 * listeners a typed contract and a single place to evolve the schema.
 */

export class ShipmentCreatedEvent {
  constructor(
    public readonly shipmentId: string,
    public readonly shipmentNumber: string,
    public readonly createdBy: string,
    public readonly correlationId?: string,
  ) {}
}

export class ShipmentUpdatedEvent {
  constructor(
    public readonly shipmentId: string,
    public readonly shipmentNumber: string,
    public readonly status: string,
    public readonly correlationId?: string,
  ) {}
}

export class ShipmentDeliveredEvent {
  constructor(
    public readonly shipmentId: string,
    public readonly shipmentNumber: string,
    public readonly deliveredAt: Date,
    public readonly ownerEmail?: string,
  ) {}
}

export class UserCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly firstName: string,
  ) {}
}

export class CarrierCreatedEvent {
  constructor(
    public readonly carrierId: string,
    public readonly name: string,
  ) {}
}
