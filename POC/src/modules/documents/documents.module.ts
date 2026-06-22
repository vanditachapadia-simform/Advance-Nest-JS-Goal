import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { DocumentEntity, DocumentSchema } from './schemas/document.schema';
import { ShipmentsModule } from '../shipments/shipments.module';

/**
 * Document module — wires Multer disk storage asynchronously from config so the
 * upload directory + size limit are environment-driven. Filenames are
 * randomised (uuid) to prevent path traversal / collisions.
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: DocumentEntity.name, schema: DocumentSchema }]),
    ShipmentsModule,
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        storage: diskStorage({
          destination: config.get<string>('upload.dir') ?? './uploads',
          filename: (_req, file, cb) => cb(null, `${uuidv4()}${extname(file.originalname)}`),
        }),
        limits: { fileSize: (config.get<number>('upload.maxSizeMb') ?? 10) * 1024 * 1024 },
      }),
    }),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
