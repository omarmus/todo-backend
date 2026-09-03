import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationService } from './application/notification.service';
import { NotificationRepository } from './domain/notification.repository';
import { NotificationSchema, NotificationSchemaFactory } from './infrastructure/mongoose-notification.schema';
import { MongooseNotificationRepository } from './infrastructure/mongoose-notification.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationSchema.name, schema: NotificationSchemaFactory },
    ]),
  ],
  providers: [
    NotificationService,
    {
      provide: NotificationRepository,
      useClass: MongooseNotificationRepository,
    },
  ],
  exports: [NotificationService],
})
export class NotificationsModule {}
