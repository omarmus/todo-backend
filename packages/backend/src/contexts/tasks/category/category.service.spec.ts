import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CategoryService } from './application/category.service';
import { CategoryRepository } from './domain/category.repository';

describe('CategoryService', () => {
  let service: CategoryService;
  let repository: jest.Mocked<CategoryRepository>;

  const mockCategory = {
    id: 'cat-123',
    name: 'Trabajo',
    color: '#FF5733',
    userId: 'user-123',
  };

  const mockCategoryRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: CategoryRepository,
          useValue: mockCategoryRepository,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    repository = module.get(CategoryRepository);
    jest.clearAllMocks();
  });

  //Test 1
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  //Test 2 
  describe('findAll', () => {
    it('should return an array of categories for a user', async () => {
      repository.findAll.mockResolvedValue([mockCategory]);

      const result = await service.findAll('user-123');

      expect(result).toEqual([mockCategory]);
      expect(repository.findAll).toHaveBeenCalledWith('user-123');
    });
  });

  //Test 3
  describe('getOne', () => {
    it('should return a category by id', async () => {
      repository.findById.mockResolvedValue(mockCategory);

      const result = await service.getOne('cat-123');

      expect(result).toEqual(mockCategory);
      expect(repository.findById).toHaveBeenCalledWith('cat-123');
    });

    it('throws NotFoundException when category not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
//Test 4
  describe('create', () => {
    it('should create and return a category', async () => {
      const dto = { name: 'Trabajo', color: '#FF5733' };
      repository.create.mockResolvedValue(mockCategory);

      const result = await service.create('user-123', dto);

      expect(result).toEqual(mockCategory);
      expect(repository.create).toHaveBeenCalledWith('user-123', dto);
    });
  });
});