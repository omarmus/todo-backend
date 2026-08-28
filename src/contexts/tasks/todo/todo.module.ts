import { Module } from '@nestjs/common';
import { TodoService } from './application/todo.service';
import { TodoRepository } from './domain/todo.repository';
import { PrismaTodoRepository } from './infrastructure/prisma-todo.repository';

@Module({
  providers: [
    TodoService,
    {
      provide: TodoRepository,
      useClass: PrismaTodoRepository,
    },
  ],
  exports: [TodoService],
})
export class TodoModule {}
