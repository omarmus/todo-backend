import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { Category } from '../domain/category.entity';
import {
  CategoryRepository,
  CreateCategoryData,
  UpdateCategoryData,
} from '../domain/category.repository';

@Injectable()
export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(row: any): Category {
    return new Category(
      row.id,
      row.name,
      row.color,
      row.userId,
    );
  }

  async findAll(userId: string): Promise<Category[]> {
    const rows = await this.prisma.category.findMany({
      where: { userId },
    });

    return rows.map((row) => this.toDomain(row));
  }

  async getOne(id: string): Promise<Category | null> {
    const row = await this.prisma.category.findUnique({
      where: { id },
    });

    return row ? this.toDomain(row) : null;
  }

  async create(data: CreateCategoryData): Promise<Category> {
    const row = await this.prisma.category.create({
      data,
    });

    return this.toDomain(row);
  }

  async update(
    id: string,
    data: UpdateCategoryData,
  ): Promise<Category | null> {
    const row = await this.prisma.category.update({
      where: { id },
      data,
    });

    return this.toDomain(row);
  }

  async deleteItem(id: string): Promise<void> {
    await this.prisma.category.delete({
      where: { id },
    });
  }
}