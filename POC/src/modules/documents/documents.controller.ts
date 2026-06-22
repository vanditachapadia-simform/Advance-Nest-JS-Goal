import {
  Controller,
  Get,
  Param,
  ParseFilePipeBuilder,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { DocumentsService } from './documents.service';
import { Audit } from '../../common/decorators/audit.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

const ALLOWED_MIME = /(pdf|msword|officedocument|png|jpeg)/;

@ApiTags('Documents')
@ApiBearerAuth()
@Controller({ path: 'documents', version: '1' })
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' }, shipmentId: { type: 'string' } },
    },
  })
  @Audit({ action: 'UPLOAD', entity: 'Document' })
  @ApiOperation({ summary: 'Upload a document (PDF/DOCX/PNG/JPG, max 10MB)' })
  upload(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: ALLOWED_MIME })
        .addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 })
        .build({ fileIsRequired: true }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
    @Query('shipmentId') shipmentId?: string,
  ) {
    return this.documentsService.save({ file, uploadedBy: user.userId, shipmentId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document metadata' })
  findOne(@Param('id') id: string) {
    return this.documentsService.findById(id);
  }

  /**
   * Streams the file from disk rather than buffering it into memory — essential
   * for large invoices/reports. Returns a `StreamableFile` (skips the response
   * envelope interceptor automatically).
   */
  @Get(':id/download')
  @ApiOperation({ summary: 'Download / stream a document' })
  async download(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const doc = await this.documentsService.findById(id);
    res.set({
      'Content-Type': doc.mimeType,
      'Content-Disposition': `attachment; filename="${doc.originalName}"`,
    });
    return new StreamableFile(createReadStream(doc.path));
  }
}
