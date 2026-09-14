import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './application/category.service';
import { CategoryRepository } from './domain/category.repository';

describe('CategoryService', () => {
  let service: CategoryService;
  let repository: jest.Mocked<CategoryRepository>;

  const mockCategory = {
    id: 'cat-1',
    name: 'Trabajo',
    color: '#FF5733',
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
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    repository = module.get(CategoryRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns categories for authenticated user', async () => {
      repository.findAll.mockResolvedValue([mockCategory]);

      const result = await service.findAll('user-1');
      expect(result).toEqual([mockCategory]);
      expect(repository.findAll.mock.calls[0]).toEqual(['user-1']);
    });
  });

  describe('getOne', () => {
    it('throws NotFoundException when category not found', async () => {
      repository.getOne.mockResolvedValue(null);

      await expect(service.getOne('cat-404', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates a category with authenticated user id', async () => {
      repository.create.mockResolvedValue(mockCategory);

      const result = await service.create('user-1', {
        name: 'Trabajo',
        color: '#FF5733',
      });

      expect(result).toEqual(mockCategory);
      expect(repository.create.mock.calls[0]).toEqual([
        {
          name: 'Trabajo',
          color: '#FF5733',
          userId: 'user-1',
        },
      ]);
    });
  });
});
