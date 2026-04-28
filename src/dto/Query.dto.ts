import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class QueryDto {
  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  country_id?: string;

  @IsOptional()
  @IsString()
  age_group?: string;

  @IsOptional()
  @IsNumber()
  min_age?: number;

  @IsOptional()
  @IsNumber()
  max_age?: number;

  @IsOptional()
  @IsNumber()
  min_gender_probability?: number;

  @IsOptional()
  @IsNumber()
  max_gender_probability?: number;

  @IsOptional()
  @IsNumber()
  min_country_probability?: number;

  @IsOptional()
  @IsString()
  sort_by?: string;

  @IsOptional()
  @IsString()
  order?: string;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 10;
}
