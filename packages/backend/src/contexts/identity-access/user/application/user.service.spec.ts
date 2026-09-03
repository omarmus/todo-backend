import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../domain/user.entity';
import { UserRepository } from '../domain/user.repository';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<UserRepository>;

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
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(UserRepository);
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

      const result = await service.create({
        name: mockUser.name,
        email: mockUser.email,
        password: 'password123',
      });

      expect(result).not.toHaveProperty('password');

      expect(result.email).toBe(mockUser.email);
    });

    it('Email ya existe, debería lanzar un error', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.create({
          name: mockUser.name,
          email: mockUser.email,
          password: 'password123',
        })
      ).rejects.toThrow('User with this email already exists');
    });
  });
});
