import {
  Controller,
  Get,
  Query,
  ValidationPipe,
  UsePipes,
  Logger,
} from '@nestjs/common';
import { AttributeService } from '../services/attribute.service';
import { GetAttributesDto } from '../dto/get-attributes.dto';
import { MetricsService } from '../services/metrics.service';

@Controller('attributes')
export class AttributesController {
  private readonly logger = new Logger(AttributesController.name);

  constructor(
    private readonly attributeService: AttributeService,
    private readonly metricsService: MetricsService,
  ) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async getAttributes(@Query() filters: GetAttributesDto) {
    const startTime = Date.now();

    try {
      this.logger.log(
        `Fetching attributes with filters: ${JSON.stringify(filters)}`,
      );

      const result: any = await this.attributeService.findAll(filters);

      const duration = Date.now() - startTime;
      this.metricsService.recordRequest('GET /attributes', 200, duration);

      return {
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metricsService.recordRequest('GET /attributes', 500, duration);
      this.logger.error(
        `Error fetching attributes: ${(error as Error).message}`,
      );
      throw error;
    }
  }
}
