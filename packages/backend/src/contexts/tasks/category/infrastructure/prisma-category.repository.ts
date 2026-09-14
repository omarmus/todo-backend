import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/prisma/prisma.service';
import { Category } from '../domain/category.entity';
import {
  CreateCategoryData,
  CategoryRepository,
  UpdateCategoryData,
} from '../domain/category.repository';

@Injectable()
export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(row: {
    id: string;
    name: string;
    color: string | null;
    userId: string;
  }): Category {
    return new Category(row.id, row.name, row.color, row.userId);
  }

  async findAll(userId: string) {
    const rows = await this.prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async getOne(id: string, userId: string) {
    const row = await this.prisma.category.findFirst({ where: { id, userId } });
    return row ? this.toDomain(row) : null;
  }

  async create(data: CreateCategoryData) {
    const row = await this.prisma.category.create({ data });
    return this.toDomain(row);
  }

  async update(id: string, userId: string, data: UpdateCategoryData) {
    const existing = await this.prisma.category.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    const row = await this.prisma.category.update({
      where: { id: existing.id },
      data,
    });
    return this.toDomain(row);
  }

  async deleteItem(id: string, userId: string) {
    await this.prisma.category.deleteMany({ where: { id, userId } });
  }
}
