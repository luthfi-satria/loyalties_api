import { IsNotEmpty } from 'class-validator';

export class TNCDto {
  @IsNotEmpty()
  tnc: string;
}
