import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

/**
 * Custom pipe to validate and parse UUID parameters
 */
@Injectable()
export class ParseUuidPipe implements PipeTransform<string, string> {
  private readonly uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  transform(value: string, metadata: ArgumentMetadata): string {
    if (!this.uuidRegex.test(value)) {
      throw new BadRequestException(
        `Invalid UUID format for parameter '${metadata.data}'`,
      );
    }
    return value;
  }
}
