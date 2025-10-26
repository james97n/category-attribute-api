// test/attribute.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AttributeService } from '../services/attribute.service';
import { CacheService } from '../services/cache.service';
import { Repository } from 'typeorm';
import { Attribute } from '../entities/attribute.entity';
import { Category } from '../entities/category.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AttributeLinkType } from '../dto/get-attributes.dto';

describe('AttributeService', () => {
  let service: AttributeService;
  let attributeRepo: Repository<Attribute>;
  //   let categoryRepo: Repository<Category>;
  let cacheService: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttributeService,
        {
          provide: getRepositoryToken(Attribute),
          useValue: { createQueryBuilder: jest.fn() },
        },
        {
          provide: getRepositoryToken(Category),
          useValue: { find: jest.fn(), findOne: jest.fn() },
        },
        {
          provide: CacheService,
          useValue: {
            getCachedAttributes: jest.fn(),
            setAttributesCache: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AttributeService>(AttributeService);
    attributeRepo = module.get(getRepositoryToken(Attribute));
    // categoryRepo = module.get(getRepositoryToken(Category));
    cacheService = module.get<CacheService>(CacheService);
  });

  it('should return cached attributes when available', async () => {
    const mockCache = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
    jest
      .spyOn(cacheService, 'getCachedAttributes')
      .mockResolvedValue(mockCache);

    const result = await service.findAll({
      search: '',
      page: 1,
      limit: 10,
    } as any);
    expect(result).toEqual(mockCache);
  });

  it('should apply search filter correctly', async () => {
    const qb: any = {
      leftJoin: jest.fn().mockReturnThis(),
      loadRelationCountAndMap: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(1),
      getRawMany: jest.fn().mockResolvedValue([]),
    };
    (attributeRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
    jest.spyOn(cacheService, 'getCachedAttributes').mockResolvedValue(null);

    await service.findAll({ search: 'color' } as any);
    expect(qb.andWhere).toHaveBeenCalledWith('attribute.name ILIKE :search', {
      search: '%color%',
    });
  });

  it('should handle pagination correctly', async () => {
    const qb: any = {
      leftJoin: jest.fn().mockReturnThis(),
      loadRelationCountAndMap: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(25),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };
    (attributeRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

    const result = await service.findAll({ page: 2, limit: 10 } as any);
    expect(qb.offset).toHaveBeenCalledWith(10);
    expect(result.totalPages).toBe(3);
  });

  it('should determine link type correctly', async () => {
    const attribute = { directCategories: [{ id: 1 }] } as any;
    const determineLinkType = (
      service as unknown as {
        determineLinkType: (
          attribute: any,
          categoryIds: number[],
        ) => Promise<AttributeLinkType> | AttributeLinkType;
      }
    ).determineLinkType;
    const result = await determineLinkType(attribute, [1, 2, 3]);
    expect(result).toBe(AttributeLinkType.DIRECT);
  });
});
