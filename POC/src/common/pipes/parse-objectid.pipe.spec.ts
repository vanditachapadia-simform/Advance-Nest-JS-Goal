import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ParseObjectIdPipe } from './parse-objectid.pipe';

describe('ParseObjectIdPipe', () => {
  const pipe = new ParseObjectIdPipe();
  const meta = {} as any;

  it('converts a valid 24-char hex string to an ObjectId', () => {
    const id = new Types.ObjectId().toHexString();
    const result = pipe.transform(id, meta);
    expect(result).toBeInstanceOf(Types.ObjectId);
    expect(result.toHexString()).toBe(id);
  });

  it('throws on a malformed id', () => {
    expect(() => pipe.transform('not-an-id', meta)).toThrow(BadRequestException);
  });
});
