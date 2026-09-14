import { Module } from '@nestjs/common';
import { TodoModule } from './todo/todo.module';
import { CategoryModule } from './category/category.module';

@Module({
  imports: [TodoModule, CategoryModule],
  exports: [TodoModule, CategoryModule], 
})
export class TasksModule {}