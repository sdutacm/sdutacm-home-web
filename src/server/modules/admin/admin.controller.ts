import { InjectCtx, RequestContext, Contract, Post, Data } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import { ApiController } from '@server/decorators';
import AdminService from './admin.service';
import { GetGlobalConfigResDTO, UpdateGlobalConfigReqDTO } from '@common/modules/global-config/global-config.dto';
import { Api } from 'bwcx-api';

@ApiController()
export default class AdminController {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
    @Inject()
    private readonly adminService: AdminService,
  ) {}

  /** routes */
  @Api.Summary('获取全局配置')
  @Post('/getGlobalConfig')
  @Contract(null, GetGlobalConfigResDTO)
  public async getGlobalConfig(): Promise<GetGlobalConfigResDTO> {
    return await this.adminService.getGlobalConfig();
  }

  @Api.Summary('更新全局配置')
  @Post('/updateGlobalConfig')
  @Contract(UpdateGlobalConfigReqDTO, null)
  public async updateGlobalConfig(@Data() data: UpdateGlobalConfigReqDTO): Promise<void> {
    await this.adminService.updateGlobalConfig(data);
  }
}
