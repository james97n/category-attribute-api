// test/attribute.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AttributesController } from '../controllers/attributes.controller';
import { AttributeService } from '../services/attribute.service';
import { MetricsService } from '../services/metrics.service';

describe('AttributesController (e2e)', () => {
  let app: INestApplication;

  const mockData = {
    data: [
      { id: 1, name: 'Color', linkedType: 'DIRECT' },
      { id: 2, name: 'Size', linkedType: 'GLOBAL' },
    ],
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  const mockAttributeService = {
    findAll: jest.fn().mockResolvedValue(mockData),
  };

  const mockMetricsService = {
    recordRequest: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AttributesController],
      providers: [
        {
          provide: AttributeService,
          useValue: mockAttributeService,
        },
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Clear mock calls between tests
    jest.clearAllMocks();
    // Reset to default implementation
    mockAttributeService.findAll.mockResolvedValue(mockData);
  });

  it('GET /attributes - should return attributes with pagination', async () => {
    const response = await request(app.getHttpServer())
      .get('/attributes')
      .query({ page: 1, limit: 10 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.pagination.total).toBe(2);
  });

  it('GET /attributes - should apply keyword filtering', async () => {
    await request(app.getHttpServer())
      .get('/attributes')
      .query({ search: 'Color' });
    expect(mockAttributeService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'Color' }),
    );
  });

  it('GET /attributes - should apply sorting & pagination params', async () => {
    await request(app.getHttpServer()).get('/attributes').query({
      sortBy: 'name',
      sortOrder: 'DESC',
      page: 2,
      limit: 5,
    });

    expect(mockAttributeService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: 'name',
        sortOrder: 'DESC',
        page: 2,
        limit: 5,
      }),
    );
  });

  it('GET /attributes - should record metrics on success', async () => {
    // const metricsService = app.get(MetricsService);
    await request(app.getHttpServer()).get('/attributes');
    expect(mockMetricsService.recordRequest).toHaveBeenCalledWith(
      'GET /attributes',
      200,
      expect.any(Number),
    );
  });
});
