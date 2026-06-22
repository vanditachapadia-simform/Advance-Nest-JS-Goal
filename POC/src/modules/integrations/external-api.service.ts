import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom, retry, timer } from 'rxjs';
import { AxiosError } from 'axios';

/**
 * Wraps outbound calls to external providers (maps / carrier / weather) using
 * the HTTP module. Adds a bounded exponential-backoff RETRY so transient 5xx /
 * network errors self-heal, and converts terminal failures into a clean 503.
 */
@Injectable()
export class ExternalApiService {
  private readonly logger = new Logger(ExternalApiService.name);
  private readonly maxRetries: number;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.maxRetries = this.config.get<number>('http.maxRetries') ?? 3;
  }

  /** Fetch current weather for a coordinate (Open-Meteo, no key required). */
  async getWeather(lat: number, lng: number): Promise<unknown> {
    const base = this.config.get<string>('http.weatherApiBaseUrl');
    const url = `${base}/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`;
    return this.request(url, 'weather');
  }

  /** Geocode an address via the configured maps provider. */
  async geocode(address: string): Promise<unknown> {
    const key = this.config.get<string>('http.googleMapsApiKey');
    if (!key) {
      this.logger.warn('GOOGLE_MAPS_API_KEY not set — returning stub geocode');
      return { address, lat: 0, lng: 0, stub: true };
    }
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address,
    )}&key=${key}`;
    return this.request(url, 'geocode');
  }

  /** Pull tracking info from an external carrier API. */
  async getCarrierTracking(trackingNumber: string): Promise<unknown> {
    const base = this.config.get<string>('http.carrierApiBaseUrl');
    return this.request(`${base}/tracking/${trackingNumber}`, 'carrier-tracking');
  }

  private async request<T>(url: string, label: string): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.http.get<T>(url).pipe(
          retry({
            count: this.maxRetries,
            delay: (error: AxiosError, attempt) => {
              this.logger.warn(`${label} attempt ${attempt} failed: ${error.message}`);
              return timer(Math.min(1000 * 2 ** attempt, 8000)); // exp backoff, capped
            },
          }),
          catchError((error: AxiosError) => {
            throw new ServiceUnavailableException(`External API "${label}" failed: ${error.message}`);
          }),
        ),
      );
      return response.data;
    } catch (err) {
      this.logger.error(`${label} exhausted retries: ${(err as Error).message}`);
      throw err;
    }
  }
}
