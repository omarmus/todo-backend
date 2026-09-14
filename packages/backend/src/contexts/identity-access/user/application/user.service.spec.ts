import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../domain/user.entity';
import { UserRepository } from '../domain/user.repository';
import { UserService } from './user.service';
import { NotificationPort } from 'src/contexts/tasks/todo/domain/notification.port';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<UserRepository>;
  let notificationPort: jest.Mocked<NotificationPort>;

  const mockUser = new User(
    '000001',
    'juan@test.com',
    'Juan',
    'hashed-password',
    'CLIENT',
    'ACTIVE',
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: {
            findAll: jest.fn(),
            create: jest.fn(),
            findByEmail: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: NotificationPort,
          useValue: {
            send: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(UserRepository);
    notificationPort = module.get(NotificationPort);
  });

  it('Debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('Retorna un array de usuarios seguros', async () => {
      userRepository.findAll.mockResolvedValue([mockUser]);

      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('password');
    });
  });

  describe('create', () => {
    it('Crea un nuevo usuario y retorna un usuario seguro', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(mockUser);

      const result = await service.create(
        {
          name: mockUser.name,
          email: mockUser.email,
          password: 'password123',
        },
        'caller-id',
      );

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe(mockUser.email);
      expect(notificationPort.send).toHaveBeenCalled();
    });

    it('Email ya existe, debería lanzar un error', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.create(
          {
            name: mockUser.name,
            email: mockUser.email,
            password: 'password123',
          },
          'caller-id',
        ),
      ).rejects.toThrow('User with this email already exists');
    });
  });

  describe('getOne', () => {
    it('retorna un usuario seguro por id', async () => {
      userRepository.findById.mockResolvedValue(mockUser);

      const result = await service.getOne(mockUser.id);
      expect(result.id).toBe(mockUser.id);
      expect(result).not.toHaveProperty('password');
    });

    it('lanza NotFoundException si no existe', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.getOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('permite actualizar al propio usuario', async () => {
      const updated = new User(
        mockUser.id,
        mockUser.email,
        'Nuevo Nombre',
        mockUser.password,
        mockUser.role,
        mockUser.status,
      );
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue(updated);

      const result = await service.update(
        mockUser.id,
        { name: 'Nuevo Nombre' },
        { id: mockUser.id, role: 'CLIENT' },
      );

      expect(result).not.toHaveProperty('password');
      expect(userRepository.update).toHaveBeenCalledWith(
        mockUser.id,
        { name: 'Nuevo Nombre' }
      );
    });

    it('bloquea update de otro usuario cuando no es admin', async () => {
      userRepository.findById.mockResolvedValue(mockUser);

      await expect(
        service.update(
          mockUser.id,
          { name: 'X' },
          { id: 'other-user', role: 'CLIENT' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('solo admin puede eliminar', async () => {
      await expect(
        service.delete(mockUser.id, { id: 'u1', role: 'CLIENT' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('admin elimina usuario existente', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.delete.mockResolvedValue(undefined);

      const result = await service.delete(mockUser.id, {
        id: 'admin',
        role: 'ADMIN',
      });
      expect(result).toEqual({ message: 'User deleted successfully' });
      expect(userRepository.delete).toHaveBeenCalledWith(
        mockUser.id,
      );
    });

    it('lanza ConflictException cuando hay relaciones asociadas', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.delete.mockRejectedValue(new Error('foreign key'));

      await expect(
        service.delete(mockUser.id, {
          id: 'admin',
          role: 'ADMIN',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
