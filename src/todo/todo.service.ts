import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodoService {
  constructor(private readonly prisma: PrismaService) {}

  getAll() {
    return this.prisma.todo.findMany();
  }

  getOne(id: number) {
    return this.prisma.todo.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateTodoDto) {
    return this.prisma.todo.create({ data: dto });
  }

  update(id: number, dto: UpdateTodoDto) {
    return this.prisma.todo.update({ where: { id }, data: dto });
  }

  deleteItem(id: number) {
    return this.prisma.todo.delete({ where: { id } });
  }
}
