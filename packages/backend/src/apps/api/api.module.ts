import { Module } from '@nestjs/common';
import { TodoController } from './todo.controller';
import { TodoModule } from 'src/contexts/tasks/todo/todo.module';
import { CategoryModule } from 'src/contexts/tasks/category/category.module';
import { UserController } from './user.controller';
import { UserModule } from 'src/contexts/identity-access/user/user.module';
import { AuthController } from './auth.controller';
import { AuthModule } from 'src/contexts/identity-access/auth/auth.module';
import { CategoryController } from './category.controller';

@Module({
  imports: [TodoModule, CategoryModule, UserModule, AuthModule],
  controllers: [
    TodoController,
    CategoryController,
    UserController,
    AuthController,
  ],
  providers: [],
})
export class ApiModule {}
