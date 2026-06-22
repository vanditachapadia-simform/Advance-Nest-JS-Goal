import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { QUEUE } from '../shared/constants';
import { QueueService } from './queue.service';
import { EmailProcessor } from './processors/email.processor';
import { ReportProcessor } from './processors/report.processor';
import { DocumentProcessor } from './processors/document.processor';
import {
  DocumentEntity,
  DocumentSchema,
} from '../modules/documents/schemas/document.schema';

/**
 * Background-processing module (BullMQ + Redis).
 *
 * `forRootAsync` wires the shared Redis connection; `registerQueue` declares the
 * three queues. Exporting `BullModule` + `QueueService` lets any feature module
 * enqueue jobs. Marked `@Global()` for ergonomic injection of `QueueService`.
 */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
          password: config.get<string>('redis.password'),
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE.EMAIL },
      { name: QUEUE.REPORT },
      { name: QUEUE.DOCUMENT },
    ),
    MongooseModule.forFeature([{ name: DocumentEntity.name, schema: DocumentSchema }]),
  ],
  providers: [QueueService, EmailProcessor, ReportProcessor, DocumentProcessor],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
