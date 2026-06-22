import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { customAlphabet } from 'nanoid';
import { RedisService } from '../redis/redis.service';
import { ShortenResponseDto, UrlStatsDto } from './dto/url-stats.dto';

// URL-safe alphabet (no look-alike ambiguity is fine for a demo).
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CODE_LENGTH = 7;
const nanoid = customAlphabet(ALPHABET, CODE_LENGTH);

@Injectable()
export class UrlService {
  private readonly ttlSeconds: number;
  private readonly baseUrl: string;

  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {
    this.ttlSeconds = Number(this.config.get('URL_TTL_SECONDS')) || 3600;
    this.baseUrl = this.config.get<string>('BASE_URL') || 'http://localhost:3000';
  }

  private urlKey(code: string): string {
    return `url:${code}`;
  }

  private clicksKey(code: string): string {
    return `clicks:${code}`;
  }

  /**
   * Generate a unique short code and store the mapping with a TTL.
   * Demonstrates: SET ... EX, EXISTS.
   */
  async shorten(url: string): Promise<ShortenResponseDto> {
    let code = nanoid();
    // Avoid the (astronomically unlikely) collision for correctness.
    while (await this.redis.exists(this.urlKey(code))) {
      code = nanoid();
    }

    await this.redis.set(this.urlKey(code), url, this.ttlSeconds);
    // Initialise the click counter with the same TTL so it expires alongside the URL.
    await this.redis.set(this.clicksKey(code), '0', this.ttlSeconds);

    return {
      code,
      shortUrl: `${this.baseUrl}/${code}`,
      expiresInSeconds: this.ttlSeconds,
    };
  }

  /**
   * Resolve a code to its original URL and record a click.
   * Demonstrates: GET, INCR.
   */
  async resolve(code: string): Promise<string> {
    const url = await this.redis.get(this.urlKey(code));
    if (!url) {
      throw new NotFoundException(`Short code "${code}" not found or expired`);
    }
    await this.redis.incr(this.clicksKey(code));
    return url;
  }

  /**
   * Return analytics for a code.
   * Demonstrates: GET, TTL (-2 means the key is gone/expired).
   */
  async getStats(code: string): Promise<UrlStatsDto> {
    const originalUrl = await this.redis.get(this.urlKey(code));
    if (!originalUrl) {
      throw new NotFoundException(`Short code "${code}" not found or expired`);
    }

    const clicks = Number((await this.redis.get(this.clicksKey(code))) ?? 0);
    const ttlSeconds = await this.redis.ttl(this.urlKey(code));

    return { code, originalUrl, clicks, ttlSeconds };
  }
}
