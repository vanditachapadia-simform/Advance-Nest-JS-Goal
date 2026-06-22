import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create audit log entry
   */
  async create(createAuditLogDto: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data: createAuditLogDto,
    });
  }

  /**
   * Get all audit logs with filters
   */
  async findAll(filters?: {
    userId?: string;
    entity?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { userId, entity, startDate, endDate, page = 1, limit = 50 } = filters || {};

    const where: any = {};

    if (userId) where.userId = userId;
    if (entity) where.entity = entity;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              employee: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Log user action
   */
  async logAction(
    userId: string,
    action: string,
    entity: string,
    entityId?: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.create({
      userId,
      action,
      entity,
      entityId,
      details,
      ipAddress,
      userAgent,
    });
  }
}
