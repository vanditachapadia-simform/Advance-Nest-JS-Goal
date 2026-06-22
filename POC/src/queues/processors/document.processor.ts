import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QUEUE } from '../../shared/constants';
import { DocumentEntity } from '../../modules/documents/schemas/document.schema';

/**
 * Consumes the `document` queue. Simulates async post-processing of an uploaded
 * file (virus scan / OCR / thumbnailing) and flips its `processed` flag once
 * done. Demonstrates a processor that touches the database.
 */
@Processor(QUEUE.DOCUMENT, { concurrency: 3 })
export class DocumentProcessor extends WorkerHost {
  private readonly logger = new Logger(DocumentProcessor.name);

  constructor(
    @InjectModel(DocumentEntity.name) private readonly documentModel: Model<DocumentEntity>,
  ) {
    super();
  }

  async process(job: Job): Promise<{ documentId: string; processed: boolean }> {
    const { documentId } = job.data;
    this.logger.log(`Processing document ${documentId}`);
    await new Promise((r) => setTimeout(r, 100)); // simulate scan/OCR
    await this.documentModel.findByIdAndUpdate(documentId, { processed: true });
    return { documentId, processed: true };
  }
}
