import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CategoryService } from './application/category.service';
import { CategoryRepository } from './domain/category.repository';

describe('CategoryService', () => {
  let service: CategoryService;
  let repository: jest.Mocked<CategoryRepository>;

  const mockCategory = {
    id: '1',
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
    it('returns all categories for a user', async () => {
      repository.findAll.mockResolvedValue([mockCategory]);

      const result = await service.findAll('user-1');
      expect(result).toEqual([mockCategory]);
      expect(repository.findAll).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getOne', () => {
    it('throws NotFoundException when category not found', async () => {
      repository.getOne.mockResolvedValue(null);

      await expect(service.getOne('999')).rejects.toThrow(NotFoundException);
    });

    it('returns a category by id', async () => {
      repository.getOne.mockResolvedValue(mockCategory);

      const result = await service.getOne('1');
      expect(result).toEqual(mockCategory);
      expect(repository.getOne).toHaveBeenCalledWith('1');
    });
  });

  describe('create', () => {
    it('creates a category', async () => {
      repository.create.mockResolvedValue(mockCategory);

      const result = await service.create('user-1', { name: 'Trabajo', color: '#FF5733' });
      expect(result).toEqual(mockCategory);
      expect(repository.create).toHaveBeenCalledWith({
        name: 'Trabajo',
        color: '#FF5733',
        userId: 'user-1',
      });
    });
  });

  describe('deleteItem', () => {
    it('throws NotFoundException when category not found', async () => {
      repository.getOne.mockResolvedValue(null);

      await expect(service.deleteItem('999')).rejects.toThrow(NotFoundException);
    });

    it('deletes a category', async () => {
      repository.getOne.mockResolvedValue(mockCategory);
      repository.deleteItem.mockResolvedValue(undefined);

      await service.deleteItem('1');
      expect(repository.deleteItem).toHaveBeenCalledWith('1');
    });
  });
});
