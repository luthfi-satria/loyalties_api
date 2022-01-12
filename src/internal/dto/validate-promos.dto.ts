import { IsArray, IsNotEmpty } from 'class-validator';

export class ValidatePromosDto {
  @IsNotEmpty()
  @IsArray()
  promos: string[];

  // @IsOptional()
  // @IsString()
  // @IsEnum(EnumGetPromoProviderTarget)
  // target: string;

  // @IsOptional()
  // @IsString()
  // @IsEnum(EnumGetPromoProviderOrderType)
  // order_type: string;

  // @IsOptional()
  // @IsNumber()
  // @Type(() => Number)
  // cart_total: number;
}
