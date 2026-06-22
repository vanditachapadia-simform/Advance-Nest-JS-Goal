import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/** Reusable pagination + sorting query params. */
export class PaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, description: 'Page number (1-indexed)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100, description: 'Items per page' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit = 20;

  @ApiPropertyOptional({ description: 'Field to sort by, prefix with "-" for descending' })
  @IsString()
  @IsOptional()
  sort?: string;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}

/** Shape of a paginated list response. */
export class PaginatedResult<T> {
  data!: T[];
  meta!: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  static build<T>(data: T[], total: number, page: number, limit: number): PaginatedResult<T> {
    const totalPages = Math.ceil(total / limit) || 1;
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }
}
