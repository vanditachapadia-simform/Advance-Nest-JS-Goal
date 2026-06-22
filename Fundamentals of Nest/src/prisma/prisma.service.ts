import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * CONCEPT #9: Lifecycle events.
 *
 * PrismaService ties the database connection to Nest's lifecycle hooks:
 *  - OnModuleInit   -> open the connection once the module graph is ready.
 *  - OnModuleDestroy -> close it cleanly when the app shuts down
 *    (works because main.ts calls app.enableShutdownHooks()).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Prisma connected (OnModuleInit)');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Prisma disconnected (OnModuleDestroy)');
  }
}
