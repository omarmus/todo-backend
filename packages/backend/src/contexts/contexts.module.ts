import { Module } from '@nestjs/common';
import { TasksModule } from './tasks/tasks.module';
import { IdentityAccessModule } from './identity-access/identity-access.module';
import { CategoryModule } from './tasks/category/category.module';

@Module({
  imports: [TasksModule, IdentityAccessModule, CategoryModule],
  controllers: [],
  providers: [],
})
export class ContextsModule {}
