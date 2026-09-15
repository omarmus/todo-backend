import { Category } from './category.entity';

export interface CreateCategoryData {
  name: string;
  color?: string;
  userId: string;
}

export interface UpdateCategoryData {
  name?: string;
  color?: string;
}

export abstract class CategoryRepository {
  abstract findAll(): Promise<Category[]>;
  abstract getOne(id: string): Promise<Category | null>;
  abstract create(data: CreateCategoryData): Promise<Category>;
  abstract update(id: string, data: UpdateCategoryData): Promise<Category | null>;
  abstract deleteItem(id: string): Promise<void>;
}
