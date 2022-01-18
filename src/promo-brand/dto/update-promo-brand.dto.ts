import { IsNotEmpty, IsString } from 'class-validator';
import { BaseCreatePromoBrandDto } from './create-promo-brand.dto';

export class UpdatePromoBrandDto extends BaseCreatePromoBrandDto {
  id: string;
}

export class UpdatePromoBrandStatusActiveDto {
  promo_brand_id: string;
}

export class UpdatePromoBrandStatusFinishDto {
  promo_brand_id: string;
}

export class CancellPromoBrandDto {
  @IsString()
  @IsNotEmpty()
  cancellation_reason: string;

  promo_brand_id: string;

  merchant_id?: string;
}

export class StopPromoBrandDto {
  @IsString()
  @IsNotEmpty()
  cancellation_reason: string;

  promo_brand_id: string;

  merchant_id?: string;
}
