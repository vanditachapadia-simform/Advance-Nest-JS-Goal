import { ApiProperty } from '@nestjs/swagger';

export class ShortenResponseDto {
  @ApiProperty({ example: 'aB3xZ9k' })
  code: string;

  @ApiProperty({ example: 'http://localhost:3000/aB3xZ9k' })
  shortUrl: string;

  @ApiProperty({ example: 3600, description: 'Seconds until the short code expires' })
  expiresInSeconds: number;
}

export class UrlStatsDto {
  @ApiProperty({ example: 'aB3xZ9k' })
  code: string;

  @ApiProperty({ example: 'https://nestjs.com/documentation' })
  originalUrl: string;

  @ApiProperty({ example: 12, description: 'Number of times the short URL was visited' })
  clicks: number;

  @ApiProperty({ example: 3540, description: 'Remaining lifetime in seconds (from Redis TTL)' })
  ttlSeconds: number;
}
