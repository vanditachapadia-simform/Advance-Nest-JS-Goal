import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ShipmentStatus } from '../../../shared/enums';

export type ShipmentDocument = HydratedDocument<Shipment>;

/** Geo + address pairing for origin/destination. */
@Schema({ _id: false })
export class Location {
  @Prop({ required: true, trim: true })
  address!: string;

  @Prop({ trim: true })
  city?: string;

  @Prop({ trim: true })
  country?: string;

  @Prop({ type: Number })
  lat?: number;

  @Prop({ type: Number })
  lng?: number;
}
export const LocationSchema = SchemaFactory.createForClass(Location);

/** Embedded tracking event — appended as a shipment moves. */
@Schema({ _id: true, timestamps: { createdAt: 'occurredAt', updatedAt: false } })
export class TrackingEvent {
  @Prop({ enum: ShipmentStatus, required: true })
  status!: ShipmentStatus;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: Number })
  lat?: number;

  @Prop({ type: Number })
  lng?: number;

  @Prop({ trim: true })
  location?: string;

  occurredAt?: Date;
}
export const TrackingEventSchema = SchemaFactory.createForClass(TrackingEvent);

@Schema({
  timestamps: true,
  collection: 'shipments',
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, any>) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Shipment {
  /** Human-friendly tracking number, e.g. SHP-2026-000123. */
  @Prop({ required: true, unique: true, trim: true, index: true })
  shipmentNumber!: string;

  @Prop({ type: LocationSchema, required: true })
  origin!: Location;

  @Prop({ type: LocationSchema, required: true })
  destination!: Location;

  @Prop({ enum: ShipmentStatus, default: ShipmentStatus.CREATED, index: true })
  status!: ShipmentStatus;

  @Prop({ type: Types.ObjectId, ref: 'Carrier', default: null, index: true })
  carrierId?: Types.ObjectId | null;

  /** User who created/owns the shipment. */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy!: Types.ObjectId;

  /** References to Document records. */
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Document' }], default: [] })
  documents!: Types.ObjectId[];

  @Prop({ type: [TrackingEventSchema], default: [] })
  trackingEvents!: TrackingEvent[];

  @Prop({ type: Number, default: 0 })
  weightKg?: number;

  @Prop({ type: Date, default: null })
  estimatedDeliveryAt?: Date | null;

  @Prop({ type: Date, default: null })
  deliveredAt?: Date | null;
}

export const ShipmentSchema = SchemaFactory.createForClass(Shipment);

// Supports dashboards filtering by status within a carrier, sorted by recency.
ShipmentSchema.index({ carrierId: 1, status: 1, createdAt: -1 });
ShipmentSchema.index({ createdBy: 1, createdAt: -1 });
