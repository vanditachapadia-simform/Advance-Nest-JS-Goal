import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Shipment } from '../../modules/shipments/schemas/shipment.schema';
import { AuditLog } from '../../modules/audit/schemas/audit-log.schema';
import { RedisService } from '../redis/redis.service';
import { ShipmentStatus } from '../../shared/enums';

/**
 * Scheduled background jobs (node-cron via @nestjs/schedule).
 *
 *  - Daily analytics snapshot      (02:00 every day)
 *  - Stale shipment cleanup        (hourly)
 *  - Audit-log archival            (weekly)
 *  - Liveness self-check           (every 30s)
 */
@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectModel(Shipment.name) private readonly shipmentModel: Model<Shipment>,
    @InjectModel(AuditLog.name) private readonly auditModel: Model<AuditLog>,
    private readonly redis: RedisService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM, { name: 'daily-analytics' })
  async generateDailyAnalytics(): Promise<void> {
    this.logger.log('Running daily analytics snapshot');
    const byStatus = await this.shipmentModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const snapshot = byStatus.reduce(
      (acc, row) => ({ ...acc, [row._id]: row.count }),
      {} as Record<string, number>,
    );
    // Cache the snapshot for the analytics dashboard (24h TTL).
    await this.redis.set('analytics:daily', snapshot, 60 * 60 * 24);
    this.logger.log(`Daily analytics: ${JSON.stringify(snapshot)}`);
  }

  @Cron(CronExpression.EVERY_HOUR, { name: 'shipment-cleanup' })
  async cleanupStaleShipments(): Promise<void> {
    // Flag shipments stuck in CREATED for > 7 days as EXCEPTION.
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await this.shipmentModel.updateMany(
      { status: ShipmentStatus.CREATED, createdAt: { $lt: sevenDaysAgo } },
      { $set: { status: ShipmentStatus.EXCEPTION } },
    );
    if (result.modifiedCount > 0) {
      this.logger.warn(`Flagged ${result.modifiedCount} stale shipments as EXCEPTION`);
    }
  }

  @Cron(CronExpression.EVERY_WEEK, { name: 'archive-logs' })
  async archiveLogs(): Promise<void> {
    const count = await this.auditModel.estimatedDocumentCount();
    this.logger.log(`Audit log archival check — ${count} entries (TTL index handles expiry)`);
  }

  @Interval('health-check', 30_000)
  async healthCheck(): Promise<void> {
    try {
      await this.redis.getClient().ping();
      this.logger.debug('Scheduled health check OK');
    } catch (err) {
      this.logger.error(`Scheduled health check failed: ${(err as Error).message}`);
    }
  }
}
