import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PATTERNS } from '../../shared/constants';

@Controller()
export class NotificationServiceController {
  private readonly logger = new Logger(NotificationServiceController.name);

  @MessagePattern(PATTERNS.NOTIFICATION_SEND)
  send(@Payload() data: { userId: string; title: string; message: string }) {
    this.logger.log(`[notification-service] sending "${data.title}" to ${data.userId}`);
    // Real impl would integrate SES/Twilio/FCM here.
    return { delivered: true, at: new Date().toISOString() };
  }
}
