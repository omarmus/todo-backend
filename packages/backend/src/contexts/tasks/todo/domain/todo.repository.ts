import { Todo } from './todo.entity';

export interface CreateTodoData {
  title: string;
  description?: string | null;
  completed?: boolean;
  userId: string;
  dueDate?: Date | null;
  categoryId?: string | null; // 👈 ¡Faltaba agregar esto aquí!
}

export interface UpdateTodoData {
  title?: string;
  description?: string;
  completed?: boolean;
  dueDate?: string | Date | null;
  categoryId?: string | null; // 👈 Útil también por si después quieres editar la categoría
}

export abstract class TodoRepository {
  abstract findAll(): Promise<Todo[]>;
  abstract getOne(id: string): Promise<Todo | null>;
  abstract create(data: CreateTodoData): Promise<Todo>;
  abstract update(id: string, data: UpdateTodoData): Promise<Todo | null>;
  abstract deleteItem(id: string): Promise<void>;
}