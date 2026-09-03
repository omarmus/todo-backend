import { Injectable, NotFoundException } from '@nestjs/common';
import { TodoRepository, UpdateTodoData } from '../domain/todo.repository';
import { CreateTodoDto } from './dto/create-todo.dto';

@Injectable()
export class TodoService {
  constructor(private readonly todoRepository: TodoRepository) {}

  async findAll() {
    return this.todoRepository.findAll();
  }

  async getOne(id: string) {
    const todo = await this.todoRepository.getOne(id);
    if (!todo) {
      throw new NotFoundException(`Todo with id ${id} not found`);
    }
    return todo;
  }

  async create(userId: string, dto: CreateTodoDto) {
    return this.todoRepository.create({
      title: dto.title,
      description: dto.description || '',
      completed: false,
      userId,
    });
  }

  async update(id: string, dto: UpdateTodoData) {
    await this.getOne(id);
    return this.todoRepository.update(id, dto);
  }

  async deleteItem(id: string) {
    await this.getOne(id);
    return this.todoRepository.deleteItem(id);
  }
}
