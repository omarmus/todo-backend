import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryRepository } from '../domain/category.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async findAll(userId: string) {
    return this.categoryRepository.findAll(userId);
  }

  async getOne(id: string) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async create(userId: string, dto: CreateCategoryDto) {
    return this.categoryRepository.create(userId, dto);
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.getOne(id);
    return this.categoryRepository.update(id, dto);
  }

  async deleteItem(id: string) {
    await this.getOne(id);
    await this.categoryRepository.delete(id);
  }
}