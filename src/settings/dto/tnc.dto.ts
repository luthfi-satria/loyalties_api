import { IsNotEmpty } from 'class-validator';

export class TNCDto {
  @IsNotEmpty()
  tnc_id: string;

  @IsNotEmpty()
  tnc_en: string;
}
