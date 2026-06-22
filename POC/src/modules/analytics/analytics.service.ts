import { Injectable } from '@nestjs/common';
import { LazyModuleLoader } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ShipmentsService } from '../shipments/shipments.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { QueueService } from '../../queues/queue.service';
import { Carrier } from '../carriers/schemas/carrier.schema';
import { User } from '../users/schemas/user.schema';

export interface DashboardStats {
  shipmentsByStatus: Record<string, number>;
  totalShipments: number;
  totalCarriers: number;
  totalUsers: number;
  generatedAt: string;
}

/**
 * Aggregates cross-domain metrics for the dashboard. Results are cached in Redis
 * for 30s so repeated dashboard loads don't re-run aggregations.
 */
@Injectable()
export class AnalyticsService {
  private readonly cacheKey = 'analytics:dashboard';

  constructor(
    private readonly shipmentsService: ShipmentsService,
    private readonly redis: RedisService,
    private readonly queueService: QueueService,
    private readonly lazyModuleLoader: LazyModuleLoader,
    @InjectModel(Carrier.name) private readonly carrierModel: Model<Carrier>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async getDashboard(): Promise<DashboardStats> {
    const cached = await this.redis.get<DashboardStats>(this.cacheKey);
    if (cached) return cached;

    const [shipmentsByStatus, totalCarriers, totalUsers] = await Promise.all([
      this.shipmentsService.getStatusSummary(),
      this.carrierModel.estimatedDocumentCount().exec(),
      this.userModel.estimatedDocumentCount().exec(),
    ]);
    const totalShipments = Object.values(shipmentsByStatus).reduce((a, b) => a + b, 0);

    const stats: DashboardStats = {
      shipmentsByStatus,
      totalShipments,
      totalCarriers,
      totalUsers,
      generatedAt: new Date().toISOString(),
    };
    await this.redis.set(this.cacheKey, stats, 30);
    return stats;
  }

  /** Kicks off async generation of a downloadable dashboard report. */
  async requestDashboardReport(): Promise<{ reportId: string }> {
    const reportId = `dashboard-${Date.now()}`;
    await this.queueService.enqueueDashboardReport({ reportId });
    return { reportId };
  }

  /**
   * Generates a report synchronously by LAZY-LOADING the ReportsModule on first
   * use — its providers never touch the startup graph.
   */
  async generateLazyReport(type: string): Promise<unknown> {
    const { ReportsModule } = await import('../reports/reports.module');
    const { ReportsService } = await import('../reports/reports.service');
    const moduleRef = await this.lazyModuleLoader.load(() => ReportsModule);
    const reportsService = moduleRef.get(ReportsService);
    return reportsService.generate(type);
  }
}
