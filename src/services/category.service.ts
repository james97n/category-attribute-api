import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TreeRepository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CategoryNode, GetCategories } from '../dto/get-categories.dto';
import { CacheService } from './cache.service';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: TreeRepository<Category>,
    private readonly cacheService: CacheService,
  ) {}

  async getCategoryTree(filters: GetCategories): Promise<CategoryNode[]> {
    const cachedTree = await this.cacheService.getCachedCategoryTree(filters);
    if (cachedTree) {
      return cachedTree as CategoryNode[];
    }
    const roots = await this.categoryRepository.findRoots();

    const buildTree = async (category: Category): Promise<CategoryNode> => {
      const children =
        await this.categoryRepository.findDescendantsTree(category);

      const node: CategoryNode = {
        id: category.id,
        name: category.name,
        children: [],
      };

      if (filters.includeCounts) {
        node.associatedAttributes = await this.getDirectAttributesCount(
          category.id,
        );
        node.productsCount = await this.getProductsCount(category.id);
      }

      if (children.children && children.children.length > 0) {
        for (const child of children.children) {
          node.children.push(await buildTree(child));
        }
      }

      return node;
    };

    const tree = await Promise.all(roots.map((root) => buildTree(root)));
    await this.cacheService.setCategoryTreeCache(
      filters.includeCounts || false,
      tree,
    );
    return tree;
  }

  private async getDirectAttributesCount(categoryId: number): Promise<number> {
    const result = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoin('category.directAttributes', 'attribute')
      .where('category.id = :categoryId', { categoryId })
      .select('COUNT(attribute.id)', 'count')
      .getRawOne<{ count: string }>();

    return Number(result?.count || 0);
  }

  private async getProductsCount(categoryId: number): Promise<number> {
    const result = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoin('category.products', 'product')
      .where('category.id = :categoryId', { categoryId })
      .select('COUNT(product.id)', 'count')
      .getRawOne<{ count: string }>();

    return Number(result?.count || 0);
  }
}
