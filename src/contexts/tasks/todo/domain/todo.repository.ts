import { Todo } from './todo.entity';

export interface CreateTodoData {
  title: string;
  completed: boolean;
}

export interface UpdateTodoData {
  title: string;
  completed: boolean;
}

export abstract class TodoRepository {
  abstract findAll(): Promise<Todo[]>;
  abstract getOne(id: number): Promise<Todo | null>;
  abstract create(data: CreateTodoData): Promise<Todo | null>;
  abstract update(id: number, data: UpdateTodoData): Promise<Todo | null>;
  abstract deleteItem(id: number): Promise<void>;
}
