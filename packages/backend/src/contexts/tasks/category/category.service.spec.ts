import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './application/category.service';
import { CategoryRepository } from './domain/category.repository';
import { NotificationPort } from './domain/notification.port';
import { NotFoundException } from '@nestjs/common';

describe('CategoryService', () => {
  let service: CategoryService;
  let repository: jest.Mocked<CategoryRepository>;
  let notificationPort: jest.Mocked<NotificationPort>;

  const mockCategory = {
    id: '1',
    name: 'Test Category',
    color: 'Rojo',
    userId: 'user-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: CategoryRepository,
          useValue: {
            findAll: jest.fn(),
            getOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            deleteItem: jest.fn(),
          },
        },
        {
          provide: NotificationPort,
          useValue: {
            send: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    repository = module.get(CategoryRepository);
    notificationPort = module.get(NotificationPort);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns all categorys', async () => {
      repository.findAll.mockResolvedValue([mockCategory]);

      const result = await service.findAll();
      expect(result).toEqual([mockCategory]);
      expect(repository.findAll).toHaveBeenCalled();
    });
  });

  describe('getOne', () => {
    it('returns a category by id', async () => {
      repository.getOne.mockResolvedValue(mockCategory);

      const result = await service.getOne('1');
      expect(result).toEqual(mockCategory);
      expect(repository.getOne).toHaveBeenCalledWith('1');
    });

    it('throws NotFoundException when category not found', async () => {
      repository.getOne.mockResolvedValue(null);

      await expect(service.getOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a category and sends notification', async () => {
      repository.create.mockResolvedValue(mockCategory);

      const result = await service.create('user-1', {
        title: 'Test category',
        description: 'Test description',
      });
      expect(result).toEqual(mockCategory);
      expect(repository.create).toHaveBeenCalledWith({
        title: 'Test category',
        description: 'Test description',
        completed: false,
        userId: 'user-1',
        dueDate: null,
      });
      expect(notificationPort.send).toHaveBeenCalledWith({
        userId: 'user-1',
        type: 'TASK_CREATED',
        title: 'Nueva tarea',
        message: 'Se creó la tarea "Test category"',
        metadata: { taskId: '1' },
      });
    });
  });

  describe('update', () => {
    it('updates a category and sends TASK_COMPLETED notification', async () => {
      const updated = { ...mockCategory, completed: true };
      repository.getOne.mockResolvedValue(mockCategory);
      repository.update.mockResolvedValue(updated);

      const result = await service.update('1', { completed: true });
      expect(result).toEqual(updated);
      expect(notificationPort.send).toHaveBeenCalledWith({
        userId: 'user-1',
        type: 'TASK_COMPLETED',
        title: 'Tarea completada',
        message: 'La tarea "Test category" fue completada',
        metadata: { taskId: '1' },
      });
    });

    it('does not send notification when completed does not change', async () => {
      repository.getOne.mockResolvedValue(mockCategory);
      repository.update.mockResolvedValue(mockCategory);

      await service.update('1', { title: 'New title' });
      expect(notificationPort.send).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when category not found', async () => {
      repository.getOne.mockResolvedValue(null);

      await expect(
        service.update('999', { completed: true }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteItem', () => {
    it('deletes a category', async () => {
      repository.getOne.mockResolvedValue(mockCategory);
      repository.deleteItem.mockResolvedValue(undefined);

      await service.deleteItem('1');
      expect(repository.deleteItem).toHaveBeenCalledWith('1');
    });

    it('throws NotFoundException when category not found', async () => {
      repository.getOne.mockResolvedValue(null);

      await expect(service.deleteItem('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
