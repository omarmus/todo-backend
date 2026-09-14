import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '../../contexts/identity-access/user/application/user.service';
import { JwtAuthGuard } from '../../contexts/identity-access/auth/infrastructure/jwt-auth.guard';
import { ForbiddenException } from '@nestjs/common';

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
            getOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            deleteItem: jest.fn(),
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

  describe('findOne', () => {
    it('returns user by id without password', async () => {
      userService.getOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('1');
      expect(result).toEqual(mockUser);
      expect(userService.getOne).toHaveBeenCalledWith('1');
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

  describe('update', () => {
    it('allows self update', async () => {
      userService.update.mockResolvedValue({ ...mockUser, name: 'Juan Updated' });

      const result = await controller.update(
        '1',
        { id: '1', role: 'CLIENT' },
        { name: 'Juan Updated' },
      );
      expect(result).toEqual({ ...mockUser, name: 'Juan Updated' });
      expect(userService.update).toHaveBeenCalledWith('1', { name: 'Juan Updated' });
    });

    it('allows admin to update any user', async () => {
      userService.update.mockResolvedValue({ ...mockUser, name: 'Juan Updated' });

      const result = await controller.update(
        '1',
        { id: 'admin-id', role: 'ADMIN' },
        { name: 'Juan Updated' },
      );
      expect(result).toEqual({ ...mockUser, name: 'Juan Updated' });
    });

    it('throws ForbiddenException if non-admin tries to update another user', async () => {
      await expect(
        controller.update(
          '2',
          { id: '1', role: 'CLIENT' },
          { name: 'Hack' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('allows admin to delete user', async () => {
      userService.deleteItem.mockResolvedValue(undefined);

      await controller.delete('1', { id: 'admin-id', role: 'ADMIN' });
      expect(userService.deleteItem).toHaveBeenCalledWith('1');
    });

    it('throws ForbiddenException if non-admin tries to delete user', async () => {
      await expect(
        controller.delete('1', { id: '1', role: 'CLIENT' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
