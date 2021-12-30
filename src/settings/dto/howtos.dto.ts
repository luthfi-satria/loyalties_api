import { IsNotEmpty } from 'class-validator';

export class HowtosDto {
  @IsNotEmpty()
  tnc_id: string;

  @IsNotEmpty()
  tnc_en: string;
}
