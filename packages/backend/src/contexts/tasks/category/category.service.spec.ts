import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { CategoryService } from './application/category.service';
import { CategoryRepository } from './domain/category.repository';
import { Category } from './domain/category.entity';

describe('CategoryService', () => {
  let service: CategoryService;
  let categoryRepository: jest.Mocked<CategoryRepository>;

  beforeEach(async () => {
    const mockRepository: jest.Mocked<CategoryRepository> = {
      findAll: jest.fn(),
      getOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteItem: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: CategoryRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    categoryRepository = module.get(
      CategoryRepository,
    ) as jest.Mocked<CategoryRepository>;
  });

  // Test 1: should be defined
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Test 2: findAll returns categories
  it('returns all categories', async () => {
    const categories = [
      new Category('cat-1', 'Trabajo', '#FF5733', 'user-1'),
      new Category('cat-2', 'Personal', '#33FF57', 'user-1'),
    ];

    categoryRepository.findAll.mockResolvedValue(categories);

    const result = await service.findAll('user-1');

    expect(result).toEqual(categories);
    expect(categoryRepository.findAll).toHaveBeenCalledWith('user-1');
  });

  // Test 3: getOne throws NotFoundException when not found
  it('throws NotFoundException when category not found', async () => {
    categoryRepository.getOne.mockResolvedValue(null);

    await expect(
      service.getOne('category-inexistente'),
    ).rejects.toThrow(NotFoundException);

    expect(categoryRepository.getOne).toHaveBeenCalledWith(
      'category-inexistente',
    );
  });
});