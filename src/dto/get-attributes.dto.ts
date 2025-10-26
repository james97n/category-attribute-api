import {
  IsOptional,
  IsString,
  IsArray,
  IsEnum,
  IsInt,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum AttributeLinkType {
  DIRECT = 'direct',
  INHERITED = 'inherited',
  GLOBAL = 'global',
}

export class GetAttributesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 25;

  @IsOptional()
  @IsString()
  sortBy?: string = 'name';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'ASC';

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @Transform(({ value }) => {
    if (value == null) return undefined;
    if (Array.isArray(value)) {
      return value.map((v) => Number(v));
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .flatMap((v) => v.split(' '))
        .filter(Boolean)
        .map((v) => Number(v));
    }
    return [Number(value)];
  })
  categoryIds?: number[];

  @IsOptional()
  @IsEnum(AttributeLinkType, { each: true })
  @Transform(({ value }) => {
    if (value == null) return undefined;
    if (Array.isArray(value)) return value as AttributeLinkType[];
    if (typeof value === 'string') {
      return value.split(',').map((v) => v.trim()) as AttributeLinkType[];
    }
    return [value as AttributeLinkType];
  })
  linkTypes?: AttributeLinkType[];

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  notApplicable?: boolean;
}

export type GetAttributes = GetAttributesDto;

export class AttributeWithCategoryDTO {
  id: number;
  name: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  productsInUse: number;
  productCategory: string;
  linkedType?: AttributeLinkType;
}

export type PaginatedAttributesResult = {
  data: AttributeWithCategoryDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
