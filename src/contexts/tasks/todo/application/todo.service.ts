import { Injectable, NotFoundException } from '@nestjs/common';
import { TodoRepository } from '../domain/todo.repository';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodoService {
  constructor(private readonly todoRepository: TodoRepository) {}

  async findAll() {
    return this.todoRepository.findAll();
  }

  async getOne(id: number) {
    const todo = await this.todoRepository.getOne(id);
    if (!todo) {
      throw new NotFoundException(`Todo with id ${id} not found`);
    }
    return todo;
  }

  async create(dto: CreateTodoDto) {
    return this.todoRepository.create({
      title: dto.title,
      completed: false,
    });
  }

  async update(id: number, dto: UpdateTodoDto) {
    await this.getOne(id);
    return this.todoRepository.update(id, {
      title: dto.title,
      completed: dto.completed,
    });
  }

  async deleteItem(id: number) {
    await this.getOne(id);
    return this.todoRepository.deleteItem(id);
  }
}
