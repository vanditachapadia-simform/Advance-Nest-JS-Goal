import { plainToInstance, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

/**
 * Boot-time environment validation.
 *
 * Wired into `ConfigModule.forRoot({ validate })`. If a required variable is
 * missing or malformed, the application fails fast at startup rather than
 * crashing later with a cryptic runtime error.
 */

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  APP_PORT = 3000;

  @IsString()
  MONGO_URI!: string;

  @IsString()
  REDIS_HOST!: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  REDIS_PORT = 6379;

  @IsString()
  JWT_ACCESS_SECRET!: string;

  @IsString()
  JWT_REFRESH_SECRET!: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors
      .map((e) => `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
      .join('\n  ');
    throw new Error(`Invalid environment configuration:\n  ${details}`);
  }

  return validatedConfig;
}
