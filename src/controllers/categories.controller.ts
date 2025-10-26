import {
  Controller,
  Get,
  Query,
  ValidationPipe,
  UsePipes,
  Logger,
} from '@nestjs/common';
import { CategoryService } from '../services/category.service';
import { CategoryNode, GetCategoriesDto } from '../dto/get-categories.dto';
import { MetricsService } from '../services/metrics.service';

@Controller('categories')
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);

  constructor(
    private readonly categoryService: CategoryService,
    private readonly metricsService: MetricsService,
  ) {}

  @Get('tree')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getCategoryTree(
    @Query() filters: GetCategoriesDto,
  ): Promise<{ success: boolean; data: CategoryNode[] }> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `Fetching category tree with includeCounts: ${filters.includeCounts}`,
      );

      const tree = await this.categoryService.getCategoryTree(filters);

      const duration = Date.now() - startTime;
      this.metricsService.recordRequest('GET /categories/tree', 200, duration);

      return {
        success: true,
        data: tree,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metricsService.recordRequest('GET /categories/tree', 500, duration);
      this.logger.error(`Error fetching category tree: ${error.message}`);
      throw error;
    }
  }
}
