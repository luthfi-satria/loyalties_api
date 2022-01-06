import { IsNotEmpty, IsString } from 'class-validator';
import { BaseCreatePromoProviderDto } from './create-promo-provider.dto';

export class UpdatePromoProviderDto extends BaseCreatePromoProviderDto {
  id: string;
}

export class UpdatePromoProviderStatusActiveDto {
  promo_provider_id: string;
}

export class UpdatePromoProviderStatusFinishDto {
  promo_provider_id: string;
}

export class CancellPromoProviderDto {
  @IsString()
  @IsNotEmpty()
  cancellation_reason: string;

  promo_provider_id: string;
}

export class StopPromoProviderDto {
  @IsString()
  @IsNotEmpty()
  cancellation_reason: string;

  promo_provider_id: string;
}
