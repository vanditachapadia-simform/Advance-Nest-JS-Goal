import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DocumentEntityDocument = HydratedDocument<DocumentEntity>;

/**
 * Metadata for an uploaded file. The binary itself lives on disk (UPLOAD_DIR);
 * only the metadata + storage path are persisted here.
 */
@Schema({
  timestamps: true,
  collection: 'documents',
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
export class DocumentEntity {
  @Prop({ required: true })
  originalName!: string;

  @Prop({ required: true })
  storedName!: string;

  @Prop({ required: true })
  mimeType!: string;

  @Prop({ required: true })
  sizeBytes!: number;

  @Prop({ required: true })
  path!: string;

  @Prop({ type: Types.ObjectId, ref: 'Shipment', default: null, index: true })
  shipmentId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploadedBy!: Types.ObjectId;

  /** Set by the document-processing queue once OCR/virus scan completes. */
  @Prop({ default: false })
  processed!: boolean;
}

export const DocumentSchema = SchemaFactory.createForClass(DocumentEntity);
