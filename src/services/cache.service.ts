import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { GetCategories } from 'src/dto/get-categories.dto';
import { GetAttributes } from 'src/dto/get-attributes.dto';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  getAttributesCacheKey(filters: GetAttributes): string {
    return `attributes:${JSON.stringify(filters)}`;
  }

  getCategoryTreeCacheKey(includeCounts: boolean): string {
    return `category_tree:${includeCounts}`;
  }

  async setAttributesCache(
    filters: GetAttributes,
    data: any,
    ttl = 30000,
  ): Promise<void> {
    const key = this.getAttributesCacheKey(filters);
    await this.cacheManager.set(key, data, ttl);
  }

  async getCachedAttributes(filters: any): Promise<any> {
    const key = this.getAttributesCacheKey(filters);
    console.log('read attributes from cache');
    return this.cacheManager.get(key);
  }

  async setCategoryTreeCache(
    includeCounts: boolean,
    data: any,
    ttl = 30000,
  ): Promise<void> {
    const key = this.getCategoryTreeCacheKey(includeCounts);
    await this.cacheManager.set(key, data, ttl);
  }

  async getCachedCategoryTree(filter: GetCategories): Promise<any> {
    const key = this.getCategoryTreeCacheKey(filter.includeCounts || false);
    console.log('read category tree from cache');
    return this.cacheManager.get(key);
  }
}
