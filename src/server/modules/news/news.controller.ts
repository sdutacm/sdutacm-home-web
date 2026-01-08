import { Data, Controller, InjectCtx, RequestContext, Post, Contract } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import { Api } from 'bwcx-api';
import { ApiController } from '@server/decorators';
import NewsService from './news.service';
import {
  CreateNewsReqDTO,
  UpdateNewsReqDTO,
  DeleteNewsReqDTO,
  GetNewsDetailResDTO,
  GetNewsListResDTO,
  GetNewsReqDTO,
} from '@common/modules/news/news.dto';

@ApiController()
export default class NewsController {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
    @Inject()
    private readonly newsService: NewsService
  ) {}

  @Api.Summary('创建新闻')
  @Post('/createNews')
  @Contract(CreateNewsReqDTO, null)
  public async createNews(@Data() data: CreateNewsReqDTO): Promise<void> {
    await this.newsService.createNews(data);
  }

  @Api.Summary('更新新闻')
  @Post('/updateNews')
  @Contract(UpdateNewsReqDTO, null)
  public async updateNews(@Data() data: UpdateNewsReqDTO): Promise<void> {
    await this.newsService.updateNews(data);
  }

  @Api.Summary('删除新闻')
  @Post('/deleteNews')
  @Contract(DeleteNewsReqDTO, null)
  public async deleteNews(@Data() data: DeleteNewsReqDTO): Promise<void> {
    await this.newsService.deleteNews(data);
  }

  @Api.Summary('获取新闻详情')
  @Post('/getNews')
  @Contract(GetNewsReqDTO, GetNewsDetailResDTO)
  public async getNews(@Data() data: GetNewsReqDTO): Promise<GetNewsDetailResDTO> {
    return await this.newsService.getNews(data);
  }

  @Api.Summary('获取所有新闻列表')
  @Post('/getAllNews')
  @Contract(null, GetNewsListResDTO)
  public async getAllNews(): Promise<GetNewsListResDTO> {
    return await this.newsService.getAllNews();
  }
}
