import { Injectable } from '@nestjs/common';
import { Todo } from './entities/todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';

@Injectable()
export class TodoService {
  private todos: Todo[] = [
    { id: 1, title: 'Learn NestJS', completed: false },
    { id: 2, title: 'Build a REST API', completed: false },
    { id: 3, title: 'Write unit tests', completed: false },
  ];

  getAll(): Todo[] {
    return this.todos;
  }

  create({ title }: CreateTodoDto): Todo {
    const id = this.todos.length + 1;
    const todo = new Todo();
    todo.id = id;
    todo.title = title;
    todo.completed = false;
    this.todos.push(todo);

    return todo;
  }
}
