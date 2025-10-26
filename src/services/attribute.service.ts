import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Brackets } from 'typeorm';
import { Attribute } from '../entities/attribute.entity';
import { Category } from '../entities/category.entity';
import {
  AttributeLinkType,
  AttributeWithCategoryDTO,
  PaginatedAttributesResult,
  GetAttributes,
} from '../dto/get-attributes.dto';
import { CacheService } from './cache.service';

@Injectable()
export class AttributeService {
  constructor(
    @InjectRepository(Attribute)
    private attributeRepository: Repository<Attribute>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(filters: GetAttributes): Promise<PaginatedAttributesResult> {
    const cachedData = await this.cacheService.getCachedAttributes(filters);
    if (cachedData) {
      return cachedData as PaginatedAttributesResult;
    }

    const { search, page, limit, sortBy, sortOrder, categoryIds, linkTypes } =
      filters;

    const query = this.attributeRepository
      .createQueryBuilder('attribute')
      .leftJoin('attribute.directCategories', 'directCategory')
      .leftJoin('attribute.attributeValues', 'attributeValues')
      .loadRelationCountAndMap(
        'attribute.productsInUse',
        'attribute.attributeValues',
      )
      .addSelect(
        "STRING_AGG(DISTINCT directCategory.name, ', ')",
        'productCategory',
      )
      .groupBy('attribute.id');

    // Search filter
    if (search) {
      query.andWhere('attribute.name ILIKE :search', { search: `%${search}%` });
    }

    // Category-based filtering
    if (categoryIds && categoryIds.length > 0) {
      const categories = await this.categoryRepository.find({
        where: { id: In(categoryIds) },
        relations: ['parent', 'children'],
      });

      if (categories.length === 0) {
        throw new NotFoundException('Categories not found');
      }

      // Get all ancestor category IDs for inheritance
      const allCategoryIds = new Set<number>();
      for (const category of categories) {
        await this.getAllAncestorIds(category.id, allCategoryIds);
        allCategoryIds.add(category.id);
      }

      const categoryIdArray = Array.from(allCategoryIds);
      // Apply link type filtering
      if (linkTypes && linkTypes.length > 0) {
        const conditions: string[] = [];

        if (linkTypes.includes(AttributeLinkType.DIRECT)) {
          conditions.push('directCategory.id IN (:...categoryIds)');
        }

        if (linkTypes.includes(AttributeLinkType.INHERITED)) {
          conditions.push(
            '(directCategory.id IN (:...categoryIdArray) AND directCategory.id NOT IN (:...categoryIds))',
          );
        }

        if (linkTypes.includes(AttributeLinkType.GLOBAL)) {
          conditions.push('directCategory.id IS NULL');
        }

        if (conditions.length > 0) {
          query.andWhere(
            new Brackets((qb) => {
              conditions.forEach((condition, index) => {
                if (index === 0) {
                  qb.where(condition, { categoryIds, categoryIdArray });
                } else {
                  qb.orWhere(condition, { categoryIds, categoryIdArray });
                }
              });
            }),
          );
        }
      } else {
        // Default: show all applicable attributes
        query.andWhere(
          'directCategory.id IN (:...categoryIdArray) OR directCategory.id IS NULL',
          { categoryIdArray },
        );
      }
    }

    // Sorting
    const allowedSortFields = ['name', 'type', 'createdAt', 'updatedAt'];
    const validSortBy =
      typeof sortBy === 'string' && allowedSortFields.includes(sortBy)
        ? sortBy
        : 'name';
    query.orderBy(`attribute.${validSortBy}`, sortOrder);

    const total = await query.getCount();

    // Pagination
    const safePage = typeof page === 'number' && page > 0 ? page : 1;
    const safeLimit = typeof limit === 'number' && limit > 0 ? limit : 10;
    const skip = (safePage - 1) * safeLimit;

    const results = await query
      .orderBy(`attribute.${validSortBy}`, sortOrder)
      .offset(skip)
      .limit(safeLimit)
      .getRawMany();

    const attributes = await Promise.all(
      results.map(async (raw) => {
        const dto = new AttributeWithCategoryDTO();
        dto.id = raw.attribute_id;
        dto.name = raw.attribute_name;
        dto.type = raw.attribute_type;
        dto.createdAt = raw.attribute_createdAt;
        dto.updatedAt = raw.attribute_updatedAt;
        dto.productsInUse = raw.attribute_productsInUse;
        dto.productCategory = raw.productCategory;
        if (categoryIds && categoryIds.length > 0) {
          const attributeEntity = await this.attributeRepository.findOne({
            where: { id: raw.attribute_id },
            relations: ['directCategories'],
          });
          if (attributeEntity) {
            dto.linkedType = await this.determineLinkType(
              attributeEntity,
              categoryIds,
            );
          } else {
            dto.linkedType = AttributeLinkType.GLOBAL;
          }
        }
        return dto;
      }),
    );

    const response = {
      data: attributes,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };

    await this.cacheService.setAttributesCache(filters, response);

    return response;
  }

  private async getAllAncestorIds(
    categoryId: number,
    categoryIds: Set<number>,
  ): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
      relations: ['parent'],
    });

    if (category && category.parent) {
      categoryIds.add(category.parent.id);
      await this.getAllAncestorIds(category.parent.id, categoryIds);
    }
  }

  private async determineLinkType(
    attribute: Attribute,
    categoryIds: number[],
  ): Promise<AttributeLinkType> {
    if (attribute.directCategories.length === 0) {
      return AttributeLinkType.GLOBAL;
    }

    const directLinked = attribute.directCategories.some((cat) =>
      categoryIds.includes(cat.id),
    );

    if (directLinked) {
      return AttributeLinkType.DIRECT;
    }

    // Check if linked to any ancestor
    for (const categoryId of categoryIds) {
      const allAncestorIds = new Set<number>();
      await this.getAllAncestorIds(categoryId, allAncestorIds);

      const inheritedLinked = attribute.directCategories.some((cat) =>
        allAncestorIds.has(cat.id),
      );

      if (inheritedLinked) {
        return AttributeLinkType.INHERITED;
      }
    }

    return AttributeLinkType.GLOBAL;
  }
}
