import { Module } from '@nestjs/common';
import { CategoryService } from './application/category.service';
import { CategoryRepository } from './domain/category.repository';
import { PrismaCategoryRepository } from './infrastructure/prisma-category.repository';
import { AuthModule } from '../../identity-access/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [
    CategoryService,
    {
      provide: CategoryRepository,
      useClass: PrismaCategoryRepository,
    },
  ],
  exports: [CategoryService],
})
export class CategoryModule {}