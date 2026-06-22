// Injection token for the options object passed into ConfigModule.forRoot().
export const CONFIG_OPTIONS = 'CONFIG_OPTIONS';

export interface AppConfigOptions {
  /** Load process.env values (defaults true). */
  loadEnv?: boolean;
  /** Static overrides merged on top of env values. */
  overrides?: Record<string, string>;
}

export interface FeatureConfigOptions {
  /** Namespace prefix, e.g. "PAYMENT" exposes PAYMENT_* keys via getFeature(). */
  namespace: string;
}
