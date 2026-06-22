import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { CarrierStatus } from '../../../shared/enums';

export type CarrierDocument = HydratedDocument<Carrier>;

@Schema({ _id: false })
export class ContactInfo {
  @Prop({ trim: true })
  contactName?: string;

  @Prop({ lowercase: true, trim: true })
  email?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  address?: string;
}
export const ContactInfoSchema = SchemaFactory.createForClass(ContactInfo);

@Schema({
  timestamps: true,
  collection: 'carriers',
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
export class Carrier {
  @Prop({ required: true, trim: true, index: true })
  name!: string;

  /** Motor Carrier number — unique federal identifier. */
  @Prop({ required: true, unique: true, trim: true })
  mcNumber!: string;

  /** Department of Transportation number. */
  @Prop({ required: true, unique: true, trim: true })
  dotNumber!: string;

  @Prop({ enum: CarrierStatus, default: CarrierStatus.PENDING_REVIEW, index: true })
  status!: CarrierStatus;

  @Prop({ type: ContactInfoSchema, default: {} })
  contactInfo!: ContactInfo;

  /** Optional link to a user account that operates this carrier. */
  @Prop({ type: String, default: null })
  ownerUserId?: string | null;
}

export const CarrierSchema = SchemaFactory.createForClass(Carrier);
CarrierSchema.index({ status: 1, name: 1 });
