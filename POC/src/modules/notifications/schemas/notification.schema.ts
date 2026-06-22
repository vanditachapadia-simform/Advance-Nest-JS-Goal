import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { NotificationChannel } from '../../../shared/enums';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({
  timestamps: true,
  collection: 'notifications',
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
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  message!: string;

  @Prop({ enum: NotificationChannel, default: NotificationChannel.IN_APP })
  channel!: NotificationChannel;

  @Prop({ default: false, index: true })
  read!: boolean;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, unknown>;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
