import { InjectCtx, RequestContext, Post, Contract } from 'bwcx-ljsm';
import { ApiController } from '@server/decorators';
import { Inject } from 'bwcx-core';
import { Api } from 'bwcx-api';
import { GetHomeDataResDTO, GetHomeNewsResDTO } from '@common/modules/home/home.dto';
import HomeService from './home.service';

@ApiController()
export default class HomeController {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
    @Inject()
    private readonly homeService: HomeService,
  ) {}

  /** routes */
  @Api.Summary('获取首页数据')
  @Post('/getHomeData')
  @Contract(null, GetHomeDataResDTO)
  public async getHomeData(): Promise<GetHomeDataResDTO> {
    return await this.homeService.getHomeData();
  }

  @Api.Summary('获取首页展示新闻')
  @Post('/getHomeNews')
  @Contract(null, GetHomeNewsResDTO)
  public async getHomeNews(): Promise<GetHomeNewsResDTO> {
    return await this.homeService.getHomeNews();
  }
}
