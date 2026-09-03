import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { NotificationRepository } from '../domain/notification.repository';
import { NotFoundException } from '@nestjs/common';

describe('NotificationService', () => {
  let service: NotificationService;
  let repository: jest.Mocked<NotificationRepository>;

  const mockNotification = {
    id: 'notif-1',
    userId: 'user-1',
    type: 'TASK_CREATED' as const,
    title: 'Nueva tarea',
    message: 'Se creó una tarea',
    metadata: { taskId: 'task-1' },
    read: false,
    createdAt: new Date('2026-09-01T12:00:00Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: NotificationRepository,
          useValue: {
            findByUserId: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            markAsRead: jest.fn(),
            deleteItem: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    repository = module.get(NotificationRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByUserId', () => {
    it('returns notifications for a user', async () => {
      repository.findByUserId.mockResolvedValue([mockNotification]);

      const result = await service.findByUserId('user-1');
      expect(result).toEqual([mockNotification]);
      expect(repository.findByUserId).toHaveBeenCalledWith('user-1');
    });
  });

  describe('findOne', () => {
    it('returns a notification by id', async () => {
      repository.findById.mockResolvedValue(mockNotification);

      const result = await service.findOne('notif-1');
      expect(result).toEqual(mockNotification);
      expect(repository.findById).toHaveBeenCalledWith('notif-1');
    });

    it('throws NotFoundException when not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a notification', async () => {
      repository.create.mockResolvedValue(mockNotification);

      const result = await service.create({
        userId: 'user-1',
        type: 'TASK_CREATED',
        title: 'Nueva tarea',
        message: 'Se creó una tarea',
        metadata: { taskId: 'task-1' },
      });

      expect(result).toEqual(mockNotification);
      expect(repository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        type: 'TASK_CREATED',
        title: 'Nueva tarea',
        message: 'Se creó una tarea',
        metadata: { taskId: 'task-1' },
      });
    });

    it('creates with empty metadata when not provided', async () => {
      repository.create.mockResolvedValue(mockNotification);

      await service.create({
        userId: 'user-1',
        type: 'TASK_CREATED',
        title: 'Nueva tarea',
        message: 'Se creó una tarea',
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ metadata: {} }),
      );
    });
  });

  describe('markAsRead', () => {
    it('marks a notification as read', async () => {
      const readNotification = { ...mockNotification, read: true };
      repository.findById.mockResolvedValue(mockNotification);
      repository.markAsRead.mockResolvedValue(readNotification);

      const result = await service.markAsRead('notif-1');
      expect(result).toEqual(readNotification);
      expect(repository.markAsRead).toHaveBeenCalledWith('notif-1');
    });

    it('throws NotFoundException when not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.markAsRead('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteItem', () => {
    it('deletes a notification', async () => {
      repository.findById.mockResolvedValue(mockNotification);
      repository.deleteItem.mockResolvedValue(undefined);

      await service.deleteItem('notif-1');
      expect(repository.deleteItem).toHaveBeenCalledWith('notif-1');
    });

    it('throws NotFoundException when not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.deleteItem('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
