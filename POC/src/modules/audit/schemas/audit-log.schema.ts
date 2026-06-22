import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

/**
 * Append-only audit trail. Written by the AuditInterceptor / AuditPlugin for
 * any state-changing request. A TTL index archives entries after 1 year.
 */
@Schema({ timestamps: { createdAt: 'timestamp', updatedAt: false }, collection: 'audit_logs' })
export class AuditLog {
  @Prop({ type: String, default: null, index: true })
  userId?: string | null;

  @Prop({ required: true })
  action!: string;

  @Prop({ required: true, index: true })
  entity!: string;

  @Prop({ type: String, default: null })
  entityId?: string | null;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, unknown>;

  @Prop({ trim: true })
  ip?: string;

  @Prop({ trim: true })
  correlationId?: string;

  timestamp?: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Auto-expire audit records after 365 days (TTL index).
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 });
AuditLogSchema.index({ entity: 1, entityId: 1, timestamp: -1 });
