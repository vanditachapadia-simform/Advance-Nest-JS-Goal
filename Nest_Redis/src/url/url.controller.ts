import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { RateLimitInterceptor } from '../common/rate-limit.interceptor';
import { CreateUrlDto } from './dto/create-url.dto';
import { ShortenResponseDto, UrlStatsDto } from './dto/url-stats.dto';
import { UrlService } from './url.service';

@ApiTags('url')
@Controller()
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post('shorten')
  @UseInterceptors(RateLimitInterceptor)
  @ApiOperation({ summary: 'Create a short code for a long URL (rate-limited per IP)' })
  @ApiResponse({ status: 201, type: ShortenResponseDto })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  shorten(@Body() dto: CreateUrlDto): Promise<ShortenResponseDto> {
    return this.urlService.shorten(dto.url);
  }

  // Declared BEFORE the catch-all `:code` route so it is matched first.
  @Get('stats/:code')
  @ApiOperation({ summary: 'Get click count and remaining TTL for a short code' })
  @ApiResponse({ status: 200, type: UrlStatsDto })
  @ApiResponse({ status: 404, description: 'Code not found or expired' })
  getStats(@Param('code') code: string): Promise<UrlStatsDto> {
    return this.urlService.getStats(code);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Redirect (302) to the original URL' })
  @ApiResponse({ status: 302, description: 'Redirect to the original URL' })
  @ApiResponse({ status: 404, description: 'Code not found or expired' })
  async redirect(@Param('code') code: string, @Res() res: Response): Promise<void> {
    const url = await this.urlService.resolve(code);
    res.redirect(302, url);
  }
}
