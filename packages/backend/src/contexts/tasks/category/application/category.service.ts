import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryRepository, UpdateCategoryData } from '../domain/category.repository';
import { NotificationPort } from '../domain/notification.port';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly notificationPort: NotificationPort,
  ) {}

  async findAll() {
    return this.categoryRepository.findAll();
  }

  async getOne(id: string) {
    const category = await this.categoryRepository.getOne(id);
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return category;
  }

  async create(userId: string, dto: CreateCategoryDto) {
    const category = await this.categoryRepository.create({
      name: dto.name,
      color: dto.color || '',
      userId,
    });

    /* await this.notificationPort.send({
      userId,
      type: 'TASK_CREATED',
      title: 'Nueva tarea',
      message: `Se creó la tarea "${dto.title}"`,
      metadata: { taskId: category.id },
    }); */

    return category;
  }

  async update(id: string, dto: UpdateCategoryData) {
    const existing = await this.getOne(id);
    
    const updated = await this.categoryRepository.update(id,{
      name: dto.name,
      color: dto.color,
    });

    /*if (dto.completed !== undefined && dto.completed !== existing.completed) {
      if (dto.completed) {
        await this.notificationPort.send({
          userId: existing.userId,
          type: 'TASK_COMPLETED',
          title: 'Tarea completada',
          message: `La tarea "${existing.title}" fue completada`,
          metadata: { taskId: id },
        });
      }
    } */

    return updated;
  }

  async deleteItem(id: string) {
    await this.getOne(id);
    return this.categoryRepository.deleteItem(id);
  }
}
