import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog } from './schemas/audit-log.schema';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

export interface AuditRecordInput {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string;
  correlationId?: string;
}

/**
 * Persists and queries the append-only audit trail. `record()` swallows its own
 * errors — audit logging must never break the primary request flow.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@InjectModel(AuditLog.name) private readonly auditModel: Model<AuditLog>) {}

  async record(input: AuditRecordInput): Promise<void> {
    try {
      await this.auditModel.create(input);
    } catch (err) {
      this.logger.error(`Failed to write audit log: ${(err as Error).message}`);
    }
  }

  async findAll(
    pagination: PaginationDto,
    filter: { entity?: string; userId?: string } = {},
  ): Promise<PaginatedResult<AuditLog>> {
    const query: Record<string, unknown> = {};
    if (filter.entity) query.entity = filter.entity;
    if (filter.userId) query.userId = filter.userId;

    const [items, total] = await Promise.all([
      this.auditModel
        .find(query)
        .sort({ timestamp: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .exec(),
      this.auditModel.countDocuments(query).exec(),
    ]);
    return PaginatedResult.build(items, total, pagination.page, pagination.limit);
  }
}
