import { Test, TestingModule } from '@nestjs/testing';
import { TodoService } from './application/todo.service';
import { TodoRepository } from './domain/todo.repository';
import { NotFoundException } from '@nestjs/common';

describe('TodoService', () => {
  let service: TodoService;
  let repository: jest.Mocked<TodoRepository>;

  const mockTodo = {
    id: '1',
    title: 'Test todo',
    description: 'Test description',
    completed: false,
    userId: 'user-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodoService,
        {
          provide: TodoRepository,
          useValue: {
            findAll: jest.fn(),
            getOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            deleteItem: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TodoService>(TodoService);
    repository = module.get(TodoRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns all todos', async () => {
      repository.findAll.mockResolvedValue([mockTodo]);

      const result = await service.findAll();
      expect(result).toEqual([mockTodo]);
      expect(repository.findAll).toHaveBeenCalled();
    });
  });

  describe('getOne', () => {
    it('returns a todo by id', async () => {
      repository.getOne.mockResolvedValue(mockTodo);

      const result = await service.getOne('1');
      expect(result).toEqual(mockTodo);
      expect(repository.getOne).toHaveBeenCalledWith('1');
    });

    it('throws NotFoundException when todo not found', async () => {
      repository.getOne.mockResolvedValue(null);

      await expect(service.getOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a todo', async () => {
      repository.create.mockResolvedValue(mockTodo);

      const result = await service.create('user-1', {
        title: 'Test todo',
        description: 'Test description',
      });
      expect(result).toEqual(mockTodo);
      expect(repository.create).toHaveBeenCalledWith({
        title: 'Test todo',
        description: 'Test description',
        completed: false,
        userId: 'user-1',
      });
    });
  });

  describe('update', () => {
    it('updates a todo', async () => {
      const updated = { ...mockTodo, completed: true };
      repository.getOne.mockResolvedValue(mockTodo);
      repository.update.mockResolvedValue(updated);

      const result = await service.update('1', { completed: true });
      expect(result).toEqual(updated);
      expect(repository.update).toHaveBeenCalledWith('1', {
        completed: true,
      });
    });

    it('throws NotFoundException when todo not found', async () => {
      repository.getOne.mockResolvedValue(null);

      await expect(
        service.update('999', { completed: true }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteItem', () => {
    it('deletes a todo', async () => {
      repository.getOne.mockResolvedValue(mockTodo);
      repository.deleteItem.mockResolvedValue(undefined);

      await service.deleteItem('1');
      expect(repository.deleteItem).toHaveBeenCalledWith('1');
    });

    it('throws NotFoundException when todo not found', async () => {
      repository.getOne.mockResolvedValue(null);

      await expect(service.deleteItem('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
