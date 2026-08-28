import { Module } from '@nestjs/common';
import { TodoController } from './todo.controller';
import { TodoModule } from 'src/contexts/tasks/todo/todo.module';

@Module({
  imports: [TodoModule],
  controllers: [TodoController],
  providers: [],
})
export class ApiModule {}
