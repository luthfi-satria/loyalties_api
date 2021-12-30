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
import { SettingsDocument } from './entities/settings.entity';
import { SettingsRepository } from './repository/settings.repository';
import _ from 'lodash';

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
    console.log(
      '===========================Start Debug howtos=================================\n',
      new Date(Date.now()).toLocaleString(),
      '\n',
      howtos,
      '\n============================End Debug howtos==================================',
    );

    for (const key in param) {
      if (Object.prototype.hasOwnProperty.call(param, key)) {
        const index = _.FindIndex(howtos, { name: param[key] });
        howtos[index].value = param[key];
      }
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
