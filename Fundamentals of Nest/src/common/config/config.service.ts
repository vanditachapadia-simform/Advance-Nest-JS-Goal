import { Inject, Injectable } from '@nestjs/common';
import { AppConfigOptions, CONFIG_OPTIONS } from './config.constants';

@Injectable()
export class ConfigService {
  private readonly store: Record<string, string>;

  constructor(@Inject(CONFIG_OPTIONS) private readonly options: AppConfigOptions) {
    const env = options.loadEnv === false ? {} : { ...process.env };
    this.store = { ...env, ...(options.overrides ?? {}) } as Record<string, string>;
  }

  get(key: string, fallback?: string): string | undefined {
    return this.store[key] ?? fallback;
  }

  getNumber(key: string, fallback: number): number {
    const raw = this.store[key];
    const n = raw === undefined ? NaN : Number(raw);
    return Number.isFinite(n) ? n : fallback;
  }

  getBoolean(key: string, fallback = false): boolean {
    const raw = this.store[key];
    if (raw === undefined) return fallback;
    return raw === 'true' || raw === '1';
  }

  /** Return all keys under a namespace, e.g. namespace "PAYMENT" -> { GATEWAY: ... }. */
  getFeature(namespace: string): Record<string, string> {
    const prefix = `${namespace}_`;
    return Object.entries(this.store)
      .filter(([k]) => k.startsWith(prefix))
      .reduce((acc, [k, v]) => ({ ...acc, [k.slice(prefix.length)]: v }), {});
  }
}
