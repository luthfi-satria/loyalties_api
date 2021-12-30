import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { In } from 'typeorm';
import { HowtosDto } from './dto/howtos.dto';
import { TNCDto } from './dto/tnc.dto';
import { SettingsDocument } from './entities/settings.entity';
import { SettingsRepository } from './repository/settings.repository';

@Injectable()
export class SettingService {
  constructor(
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
    private readonly settingsRepository: SettingsRepository,
  ) {}
  private readonly logger = new Logger(SettingService.name);

  async updateHowtos(param: HowtosDto) {
    const howtos = await this.getAndValidateSettingsByName([
      'howtos_id',
      'howtos_en',
    ]);
    for (let i = 0; i < howtos.length; i++) {
      howtos[i].value = param[howtos[i].name];
    }

    try {
      const result = await this.settingsRepository.save(howtos);
      return result;
    } catch (error) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('general.update.fail'),
              error.message,
            ],
          },
          'Bad Request',
        ),
      );
    }
  }

  async updateTermAndCondition(param: TNCDto) {
    const howtos = await this.getAndValidateSettingsByName([
      'tnc_id',
      'tnc_en',
    ]);
    for (let i = 0; i < howtos.length; i++) {
      howtos[i].value = param[howtos[i].name];
    }

    try {
      const result = await this.settingsRepository.save(howtos);
      return result;
    } catch (error) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: '',
            property: '',
            constraint: [
              this.messageService.get('general.update.fail'),
              error.message,
            ],
          },
          'Bad Request',
        ),
      );
    }
  }

  async getAndValidateSettingsByName(
    names: string[],
  ): Promise<SettingsDocument[]> {
    const settings = await this.settingsRepository.find({
      where: { name: In(names) },
    });
    if (!settings) {
      throw new BadRequestException(
        this.responseService.error(
          HttpStatus.BAD_REQUEST,
          {
            value: names.join(', '),
            property: 'name',
            constraint: [
              this.messageService.get('general.general.dataNotFound'),
            ],
          },
          'Bad Request',
        ),
      );
    }
    return settings;
  }
}
