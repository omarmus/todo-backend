import { Module } from '@nestjs/common';
import { NotificationsModule } from '../../contexts/notifications/notifications.module';
import { NotificationController } from './notification.controller';
import { NotificationGateway } from './notification.gateway';

@Module({
  imports: [NotificationsModule],
  controllers: [NotificationController],
  providers: [NotificationGateway],
  exports: [NotificationGateway],
})
export class ApiModule {}
