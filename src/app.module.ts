// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { AttributesController } from './controllers/attributes.controller';
import { CategoriesController } from './controllers/categories.controller';
import { HealthController } from './controllers/health.controller';
import { AttributeService } from './services/attribute.service';
import { CategoryService } from './services/category.service';
import { MetricsService } from './services/metrics.service';
import { Attribute } from './entities/attribute.entity';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { AttributeValue } from './entities/attribute-value.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheService } from './services/cache.service';
import { AppController } from './controllers/app.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER || 'productapp',
      password: process.env.DATABASE_PASSWORD || 'productapp123',
      database: process.env.DATABASE_NAME || 'productapp',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV !== 'production',
    }),
    CacheModule.register({ ttl: 5000 }), // 5 seconds as default
    TypeOrmModule.forFeature([Attribute, Category, Product, AttributeValue]),
    TerminusModule,
  ],
  controllers: [
    AppController,
    AttributesController,
    CategoriesController,
    HealthController,
  ],
  providers: [AttributeService, CategoryService, MetricsService, CacheService],
})
export class AppModule {}
