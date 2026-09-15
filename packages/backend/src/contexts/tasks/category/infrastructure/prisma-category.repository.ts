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

  private categorymain(row: any) {
    return new Category(
      row.id,
      row.name,
      row.color,
      row.userId,
    );
  }

  async findAll() {
    const rows = await this.prisma.category.findMany();
    return rows.map((r) => this.categorymain(r));
  }

  async getOne(id: string) {
    const row = await this.prisma.category.findUnique({ where: { id } });
    return row ? this.categorymain(row) : null;
  }

  async create(data: CreateCategoryData) {
    const row = await this.prisma.category.create({ data });
    return this.categorymain(row);
  }

  async update(id: string, data: UpdateCategoryData) {
    const row = await this.prisma.category.update({ where: { id }, data });
    return this.categorymain(row);
  }

  async deleteItem(id: string) {
    await this.prisma.category.delete({ where: { id } });
  }
}
