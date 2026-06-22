import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification } from './schemas/notification.schema';
import { NotificationOptions } from './interfaces/notification-options.interface';
import { TOKENS } from '../../shared/constants';
import { NotificationChannel } from '../../shared/enums';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

export interface SendNotificationInput {
  userId: string;
  title: string;
  message: string;
  channel?: NotificationChannel;
  metadata?: Record<string, unknown>;
}

/**
 * Persists and dispatches notifications. The behaviour (default channel, which
 * channels are enabled) is driven by `NotificationOptions` injected from the
 * DYNAMIC MODULE configuration — the same service behaves differently per
 * deployment without code changes.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name) private readonly notificationModel: Model<Notification>,
    @Inject(TOKENS.NOTIFICATION_OPTIONS) private readonly options: NotificationOptions,
  ) {}

  async send(input: SendNotificationInput): Promise<Notification | null> {
    const channel = input.channel ?? this.options.defaultChannel;

    if (!this.options.enabledChannels.includes(channel)) {
      this.logger.warn(`Channel ${channel} disabled by configuration`);
      if (this.options.dropDisabled) return null;
    }

    const notification = await this.notificationModel.create({
      userId: new Types.ObjectId(input.userId),
      title: input.title,
      message: input.message,
      channel,
      metadata: input.metadata ?? {},
    });

    this.dispatch(channel, notification);
    return notification;
  }

  async findForUser(userId: string, pagination: PaginationDto): Promise<PaginatedResult<Notification>> {
    const filter = { userId: new Types.ObjectId(userId) };
    const [items, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .exec(),
      this.notificationModel.countDocuments(filter).exec(),
    ]);
    return PaginatedResult.build(items, total, pagination.page, pagination.limit);
  }

  async markAsRead(userId: string, notificationId: string): Promise<Notification | null> {
    return this.notificationModel
      .findOneAndUpdate(
        { _id: notificationId, userId: new Types.ObjectId(userId) },
        { read: true },
        { new: true },
      )
      .exec();
  }

  /** Channel-specific delivery (stubbed). Real impl would call SES/Twilio/FCM. */
  private dispatch(channel: NotificationChannel, notification: Notification): void {
    this.logger.log(`Dispatching [${channel}] "${notification.title}" to ${notification.userId}`);
  }
}
