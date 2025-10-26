import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from '../services/category.service';
import { CacheService } from '../services/cache.service';
import { TreeRepository } from 'typeorm';
import { Category } from '../entities/category.entity';

describe('CategoryService', () => {
  let service: CategoryService;
  let cacheService: CacheService;
  let categoryRepository: Partial<TreeRepository<Category>>;

  beforeEach(async () => {
    categoryRepository = {
      findRoots: jest.fn(),
      findDescendantsTree: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      }),
    };

    cacheService = {
      getCachedCategoryTree: jest.fn(),
      setCategoryTreeCache: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: 'CategoryRepository', useValue: categoryRepository },
        { provide: CacheService, useValue: cacheService },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
  });

  it('should build a proper category tree with children', async () => {
    const rootCategory = { id: 1, name: 'Root', children: [] };
    const childCategory = { id: 2, name: 'Child', children: [] };

    (categoryRepository.findRoots as jest.Mock).mockResolvedValue([
      rootCategory,
    ]);
    (categoryRepository.findDescendantsTree as jest.Mock).mockImplementation(
      (cat) => {
        if (cat.id === 1) return { ...rootCategory, children: [childCategory] };
        return cat as Category;
      },
    );

    const tree = await service.getCategoryTree({ includeCounts: false });

    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].name).toBe('Child');
  });

  it('should include counts if includeCounts=true', async () => {
    (categoryRepository.findRoots as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Root', children: [] },
    ]);
    (categoryRepository.findDescendantsTree as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'Root',
      children: [],
    });
    (categoryRepository.createQueryBuilder as jest.Mock).mockReturnValue({
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ count: '5' }),
    });

    const tree = await service.getCategoryTree({ includeCounts: true });

    expect(tree[0].associatedAttributes).toBe(5);
    expect(tree[0].productsCount).toBe(5);
  });
});
