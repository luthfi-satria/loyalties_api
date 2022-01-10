export class CreateAutoStartPromoProviderDto {
  promo_provider_id: string;
  delay: number;
}

export class DeleteAutoStartPromoProviderDto {
  promo_provider_id: string;
}

export class CreateAutoFinishPromoProviderDto {
  promo_provider_id: string;
  delay: number;
}

export class DeleteAutoFinishPromoProviderDto {
  promo_provider_id: string;
}
