import { CategoryEntity } from './category.entity';
import { CreateCategoryDto } from '../application/dto/create-category.dto';
import { UpdateCategoryDto } from '../application/dto/update-category.dto';

export abstract class CategoryRepository {
  abstract findAll(userId: string): Promise<CategoryEntity[]>;
  abstract findById(id: string): Promise<CategoryEntity | null>;
  abstract create(userId: string, dto: CreateCategoryDto): Promise<CategoryEntity>;
  abstract update(id: string, dto: UpdateCategoryDto): Promise<CategoryEntity>;
  abstract delete(id: string): Promise<void>;
}