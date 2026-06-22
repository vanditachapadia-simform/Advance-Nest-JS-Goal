import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isValidObjectId, Types } from 'mongoose';

/**
 * Validates and converts a string route param into a Mongo `ObjectId`,
 * rejecting malformed ids with a 400 before they ever reach the service layer.
 *
 * @example  findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId)
 */
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, Types.ObjectId> {
  transform(value: string, _metadata: ArgumentMetadata): Types.ObjectId {
    if (!isValidObjectId(value)) {
      throw new BadRequestException(`"${value}" is not a valid ObjectId`);
    }
    return new Types.ObjectId(value);
  }
}
