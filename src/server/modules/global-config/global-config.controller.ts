import { InjectCtx, RequestContext, Contract, Post, Data } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import { ApiController } from '@server/decorators';
import GlobalConfigService from './global-config.service';
import { GetGlobalConfigResDTO, UpdateGlobalConfigReqDTO } from '@common/modules/global-config/global-config.dto';
import { Api } from 'bwcx-api';

@ApiController()
export default class GlobalConfigController {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
    @Inject()
    private readonly globalConfigService: GlobalConfigService,
  ) {}

  /** routes */
  @Api.Summary('获取全局配置')
  @Post('/getGlobalConfig')
  @Contract(null, GetGlobalConfigResDTO)
  public async getGlobalConfig(): Promise<GetGlobalConfigResDTO> {
    return await this.globalConfigService.getGlobalConfig();
  }

  @Api.Summary('更新全局配置')
  @Post('/updateGlobalConfig')
  @Contract(UpdateGlobalConfigReqDTO, null)
  public async updateGlobalConfig(@Data() data: UpdateGlobalConfigReqDTO): Promise<void> {
    await this.globalConfigService.updateGlobalConfig(data);
  }
}
