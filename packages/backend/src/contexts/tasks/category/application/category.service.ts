import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CategoryRepository,
  UpdateCategoryData,
} from '../domain/category.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async findAll(userId: string) {
    return this.categoryRepository.findAll(userId);
  }

  async getOne(id: string) {
    const category = await this.categoryRepository.getOne(id);

    if (!category) {
      throw new NotFoundException(
        `Category with id ${id} not found`,
      );
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

  async update(id: string, dto: UpdateCategoryDto) {
    await this.getOne(id);

    const data: UpdateCategoryData = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.color !== undefined && { color: dto.color }),
    };

    return this.categoryRepository.update(id, data);
  }

  async deleteItem(id: string) {
    await this.getOne(id);

    return this.categoryRepository.deleteItem(id);
  }
}