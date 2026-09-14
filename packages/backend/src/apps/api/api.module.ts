import { Module } from '@nestjs/common';
import { TodoController } from './todo.controller';
import { TodoModule } from 'src/contexts/tasks/todo/todo.module';
import { UserController } from './user.controller';
import { UserModule } from 'src/contexts/identity-access/user/user.module';
import { AuthController } from './auth.controller';
import { AuthModule } from 'src/contexts/identity-access/auth/auth.module';
import { CategoryController } from './category.controller';
import { TasksModule } from 'src/contexts/tasks/tasks.module';

@Module({
  imports: [TodoModule, UserModule, AuthModule, TasksModule],
  controllers: [TodoController, UserController, AuthController, CategoryController],
  providers: [],
})
export class ApiModule {}
