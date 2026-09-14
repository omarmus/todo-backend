import { Injectable } from '@nestjs/common';
import { CategoryRepository } from '../domain/category.repository';
import { CategoryEntity } from '../domain/category.entity';
import { CreateCategoryDto } from '../application/dto/create-category.dto';
import { UpdateCategoryDto } from '../application/dto/update-category.dto';
import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';

@Injectable()
export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string): Promise<CategoryEntity[]> {
    return this.prisma.category.findMany({ where: { userId } });
  }

  async findById(id: string): Promise<CategoryEntity | null> {
    return this.prisma.category.findUnique({ where: { id } });
  }

  async create(userId: string, dto: CreateCategoryDto): Promise<CategoryEntity> {
    return this.prisma.category.create({
      data: { ...dto, userId },
    });
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryEntity> {
    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }
}