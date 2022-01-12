import { Body, Controller, Get, Put } from '@nestjs/common';
import { AuthJwtGuard } from 'src/auth/auth.decorators';
import { UserType } from 'src/auth/guard/user-type.decorator';
import { MessageService } from 'src/message/message.service';
import { ResponseStatusCode } from 'src/response/response.decorator';
import { RSuccessMessage } from 'src/response/response.interface';
import { ResponseService } from 'src/response/response.service';
import { HowtosDto } from './dto/howtos.dto';
import { TNCDto } from './dto/tnc.dto';
import { SettingService } from './setting.service';

@Controller('/api/v1/loyalties/settings')
export class SettingController {
  constructor(
    private readonly settingService: SettingService,
    private readonly messageService: MessageService,
    private readonly responseService: ResponseService,
  ) {}

  @Put('howtos')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async setHowtos(@Body() data: HowtosDto): Promise<RSuccessMessage> {
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

  @Get('howtos')
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

  @Put('tnc')
  @UserType('admin')
  @AuthJwtGuard()
  @ResponseStatusCode()
  async setTermAndCondition(@Body() data: TNCDto): Promise<RSuccessMessage> {
    try {
      const result = await this.settingService.updateTermAndCondition(data);
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

  @Get('tnc')
  @ResponseStatusCode()
  async getTermAndCondition(): Promise<RSuccessMessage> {
    try {
      const result = await this.settingService.getAndValidateSettingsByName([
        'tnc_id',
        'tnc_en',
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
