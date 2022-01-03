import { IsNotEmpty } from 'class-validator';

export class HowtosDto {
  @IsNotEmpty()
  howtos_id: string;

  @IsNotEmpty()
  howtos_en: string;
}
