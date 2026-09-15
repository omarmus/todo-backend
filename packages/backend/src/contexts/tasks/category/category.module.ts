import { Module } from '@nestjs/common';
import { CategoryService } from './application/category.service';
import { CategoryRepository } from './domain/category.repository';
import { PrismaCategoryRepository } from './infrastructure/prisma-category.repository';
import { NotificationPort } from './domain/notification.port';
import { HttpNotificationAdapter } from './infrastructure/http-notification.adapter';

@Module({
  providers: [
    CategoryService,
    {
      provide: CategoryRepository,
      useClass: PrismaCategoryRepository,
    },
    {
      provide: NotificationPort,
      useClass: HttpNotificationAdapter,
    },
  ],
  exports: [CategoryService, NotificationPort],
})
export class CategoryModule {}
