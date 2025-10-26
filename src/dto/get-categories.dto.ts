import { Transform } from 'class-transformer';
import { IsOptional, IsBoolean } from 'class-validator';

export class GetCategoriesDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeCounts?: boolean;
}

export type GetCategories = GetCategoriesDto;

export interface CategoryNode {
  id: number;
  name: string;
  children: CategoryNode[];
  associatedAttributes?: number;
  productsCount?: number;
}
