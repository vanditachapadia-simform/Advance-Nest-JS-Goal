import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Logger } from '@nestjs/common';

/**
 * Database module — demonstrates an ASYNC PROVIDER.
 *
 * The Mongoose connection is initialised asynchronously using `forRootAsync` so
 * the connection string is resolved from `ConfigService` at runtime (not import
 * time). `connectionFactory` hooks let us attach connection-level logging.
 */
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const logger = new Logger('Mongoose');
        return {
          uri: config.get<string>('database.uri'),
          dbName: config.get<string>('database.dbName'),
          // Production-ready pool + timeout tuning.
          maxPoolSize: 20,
          minPoolSize: 2,
          serverSelectionTimeoutMS: 10000,
          connectionFactory: (connection: any) => {
            connection.on('connected', () => logger.log('MongoDB connected'));
            connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
            connection.on('error', (err: Error) => logger.error(`MongoDB error: ${err.message}`));
            return connection;
          },
        };
      },
    }),
  ],
})
export class DatabaseModule {}
