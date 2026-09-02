import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CreateTodoDto } from '../../contexts/tasks/todo/application/dto/create-todo.dto';
import { UpdateTodoDto } from '../../contexts/tasks/todo/application/dto/update-todo.dto';
import { TodoService } from 'src/contexts/tasks/todo/application/todo.service';
import { JwtAuthGuard } from 'src/contexts/identity-access/auth/infrastructure/jwt-auth.guard';
import { CurrentUser } from 'src/contexts/identity-access/auth/infrastructure/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('todo')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Get()
  findAll() {
    return this.todoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.todoService.getOne(id);
  }

  @Post()
  create(
    @CurrentUser() user: { id: string },
    @Body() createTodoDto: CreateTodoDto,
  ) {
    return this.todoService.create(user.id, createTodoDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTodoDto: UpdateTodoDto) {
    return this.todoService.update(id, updateTodoDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.todoService.deleteItem(id);
  }
}
