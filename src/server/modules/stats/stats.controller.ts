import { Data, InjectCtx, RequestContext, Post, Contract } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import { Api } from 'bwcx-api';
import { ApiController } from '@server/decorators';
import StatsService from './stats.service';
import {
  GetOverviewStatsResDTO,
  GetDailyViewStatsReqDTO,
  GetDailyViewStatsResDTO,
  GetAllPageViewStatsResDTO,
  RecordPageViewReqDTO,
} from '@common/modules/stats/stats.dto';

@ApiController()
export default class StatsController {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
    @Inject()
    private readonly statsService: StatsService,
  ) {}

  @Api.Summary('获取概览统计数据')
  @Post('/getOverviewStats')
  @Contract(null, GetOverviewStatsResDTO)
  public async getOverviewStats(): Promise<GetOverviewStatsResDTO> {
    return await this.statsService.getOverviewStats();
  }

  @Api.Summary('获取每日访问统计')
  @Post('/getDailyViewStats')
  @Contract(GetDailyViewStatsReqDTO, GetDailyViewStatsResDTO)
  public async getDailyViewStats(
    @Data() data: GetDailyViewStatsReqDTO
  ): Promise<GetDailyViewStatsResDTO> {
    const rows = await this.statsService.getDailyPageViewStats(
      data.pageKey,
      data.days || 30
    );
    return { rows };
  }

  @Api.Summary('获取所有页面访问统计')
  @Post('/getAllPageViewStats')
  @Contract(null, GetAllPageViewStatsResDTO)
  public async getAllPageViewStats(): Promise<GetAllPageViewStatsResDTO> {
    const rows = await this.statsService.getAllPageViewStats();
    return { rows };
  }

  @Api.Summary('记录页面访问')
  @Post('/recordPageView')
  @Contract(RecordPageViewReqDTO, null)
  public async recordPageView(@Data() data: RecordPageViewReqDTO): Promise<void> {
    await this.statsService.incrementPageViewCount(data.pageKey);
  }
}
