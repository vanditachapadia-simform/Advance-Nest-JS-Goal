import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DocumentEntity } from './schemas/document.schema';
import { ResourceNotFoundException } from '../../common/exceptions/business.exception';
import { ShipmentsService } from '../shipments/shipments.service';
import { QueueService } from '../../queues/queue.service';

export interface SaveDocumentInput {
  file: Express.Multer.File;
  uploadedBy: string;
  shipmentId?: string;
}

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(DocumentEntity.name) private readonly documentModel: Model<DocumentEntity>,
    private readonly shipmentsService: ShipmentsService,
    private readonly queueService: QueueService,
  ) {}

  async save(input: SaveDocumentInput): Promise<DocumentEntity> {
    const { file, uploadedBy, shipmentId } = input;
    const doc = await this.documentModel.create({
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      path: file.path,
      uploadedBy: new Types.ObjectId(uploadedBy),
      shipmentId: shipmentId ? new Types.ObjectId(shipmentId) : null,
    });

    // Link to shipment + kick off async processing (OCR/scan) via the queue.
    if (shipmentId) {
      await this.shipmentsService.attachDocument(shipmentId, doc._id as Types.ObjectId);
    }
    await this.queueService.enqueueDocumentProcessing({ documentId: String(doc._id) });
    return doc;
  }

  async findById(id: string): Promise<DocumentEntity> {
    const doc = await this.documentModel.findById(id).exec();
    if (!doc) throw new ResourceNotFoundException('Document', id);
    return doc;
  }
}
