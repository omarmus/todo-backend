import { Module } from '@nestjs/common';
import { TodoModule } from './todo/todo.module';
import { CategoryModule } from './category/category.module';

@Module({
  imports: [TodoModule, CategoryModule],
  controllers: [],
  providers: [],
})
export class TasksModule {}
