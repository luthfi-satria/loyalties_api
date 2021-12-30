import { Body, Controller, Get, Put } from '@nestjs/common';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { MessageService } from 'src/message/message.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { RSuccessMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { HowtosDto } from './dto/howtos.dto';
import { SettingService } from './setting.service';

@Controller('/api/v1/loyalties/settings/howtos')
export class SettingController {
  constructor(
    private readonly settingService: SettingService,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}

  @Put()
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async setHowtos(@Body() data: HowtosDto): Promise<RSuccessMessage> {
    console.log(
      '===========================Start Debug data=================================\n',
      new Date(Date.now()).toLocaleString(),
      '\n',
      data,
      '\n============================End Debug data==================================',
    );
    try {
      const result = await this.settingService.updateHowtos(data);
      return this.responseService.success(
        true,
        this.messageService.get('general.create.success'),
        result,
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @Get()
  @ResponseStatusCode()
  async getHowtos(): Promise<RSuccessMessage> {
    try {
      const result = await this.settingService.getAndValidateSettingsByName([
        'howtos_id',
        'howtos_en',
      ]);
      return this.responseService.success(
        true,
        this.messageService.get('general.list.success'),
        result,
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
