import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '../../contexts/identity-access/user/application/user.service';
import { JwtAuthGuard } from '../../contexts/identity-access/auth/infrastructure/jwt-auth.guard';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

  const mockUser = {
    id: '1',
    email: 'juan@test.com',
    name: 'Juan',
    role: 'CLIENT',
    status: 'ACTIVE',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            findAll: jest.fn(),
            create: jest.fn(),
            getOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('returns all users', async () => {
      userService.findAll.mockResolvedValue([mockUser]);

      const result = await controller.findAll();
      expect(result).toEqual([mockUser]);
      expect(userService.findAll).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('creates a user', async () => {
      userService.create.mockResolvedValue(mockUser as any);

      const result = await controller.create(
        { id: '1' },
        {
          email: 'juan@test.com',
          name: 'Juan',
          password: 'password123',
        },
      );
      expect(result).toEqual(mockUser);
      expect(userService.create).toHaveBeenCalledWith(
        {
          email: 'juan@test.com',
          name: 'Juan',
          password: 'password123',
        },
        '1',
      );
    });
  });

  describe('findOne', () => {
    it('returns one user by id', async () => {
      userService.getOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('1');
      expect(result).toEqual(mockUser);
      expect(userService.getOne).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('updates one user by id', async () => {
      userService.update.mockResolvedValue(mockUser);

      const result = await controller.update(
        '1',
        { id: '1', role: 'CLIENT' },
        { name: 'Nuevo Nombre' },
      );

      expect(result).toEqual(mockUser);
      expect(userService.update).toHaveBeenCalledWith(
        '1',
        { name: 'Nuevo Nombre' },
        { id: '1', role: 'CLIENT' },
      );
    });
  });

  describe('delete', () => {
    it('deletes one user by id', async () => {
      userService.delete.mockResolvedValue({
        message: 'User deleted successfully',
      });

      const result = await controller.delete('1', {
        id: 'admin-1',
        role: 'ADMIN',
      });
      expect(result).toEqual({ message: 'User deleted successfully' });
      expect(userService.delete).toHaveBeenCalledWith(
        '1',
        {
          id: 'admin-1',
          role: 'ADMIN',
        },
      );
    });
  });
});
