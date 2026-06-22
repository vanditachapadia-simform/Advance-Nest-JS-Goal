import { Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config.module';
import { NotificationServiceController } from './notification-service.controller';

@Module({
  imports: [AppConfigModule],
  controllers: [NotificationServiceController],
})
export class NotificationServiceModule {}
