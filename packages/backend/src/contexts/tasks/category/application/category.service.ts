import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CategoryRepository,
  UpdateCategoryData,
} from '../domain/category.repository';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async findAll(userId: string) {
    return this.categoryRepository.findAll(userId);
  }

  async getOne(id: string, userId: string) {
    const category = await this.categoryRepository.getOne(id, userId);
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return category;
  }

  async create(userId: string, dto: CreateCategoryDto) {
    return this.categoryRepository.create({
      name: dto.name,
      color: dto.color ?? null,
      userId,
    });
  }

  async update(id: string, userId: string, dto: UpdateCategoryData) {
    await this.getOne(id, userId);
    const updated = await this.categoryRepository.update(id, userId, dto);
    if (!updated) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return updated;
  }

  async deleteItem(id: string, userId: string) {
    await this.getOne(id, userId);
    return this.categoryRepository.deleteItem(id, userId);
  }
}
