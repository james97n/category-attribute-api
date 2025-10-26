import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from '../../src/controllers/categories.controller';
import { CategoryService } from '../../src/services/category.service';
import { MetricsService } from '../../src/services/metrics.service';
import { GetCategoriesDto } from '../../src/dto/get-categories.dto';

describe('CategoriesController', () => {
  let controller: CategoriesController;

  const mockCategoryService = {
    getCategoryTree: jest.fn(),
  };

  const mockMetricsService = {
    recordRequest: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoryService,
          useValue: mockCategoryService,
        },
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCategoryTree', () => {
    it('should return category tree successfully', async () => {
      const filters: GetCategoriesDto = { includeCounts: false };
      const mockTree = [
        {
          id: 1,
          name: 'Electronics',
          children: [{ id: 2, name: 'Computers', children: [] }],
        },
      ];

      mockCategoryService.getCategoryTree.mockResolvedValue(mockTree);

      const result = await controller.getCategoryTree(filters);

      expect(result).toEqual({
        success: true,
        data: mockTree,
      });
      expect(mockCategoryService.getCategoryTree).toHaveBeenCalledWith(filters);
      expect(mockMetricsService.recordRequest).toHaveBeenCalledWith(
        'GET /categories/tree',
        200,
        expect.any(Number),
      );
    });

    it('should handle errors and record metrics', async () => {
      const filters: GetCategoriesDto = { includeCounts: false };
      const error = new Error('Database error');

      mockCategoryService.getCategoryTree.mockRejectedValue(error);

      await expect(controller.getCategoryTree(filters)).rejects.toThrow(error);

      expect(mockMetricsService.recordRequest).toHaveBeenCalledWith(
        'GET /categories/tree',
        500,
        expect.any(Number),
      );
    });

    it('should transform query parameters correctly', async () => {
      const filters: GetCategoriesDto = { includeCounts: true };
      const mockTree = [
        {
          id: 1,
          name: 'Electronics',
          children: [],
          associatedAttributes: 5,
          productsCount: 10,
        },
      ];

      mockCategoryService.getCategoryTree.mockResolvedValue(mockTree);

      const result = await controller.getCategoryTree(filters);

      expect(result.success).toBe(true);
      expect(mockCategoryService.getCategoryTree).toHaveBeenCalledWith({
        includeCounts: true,
      });
    });
  });
});
