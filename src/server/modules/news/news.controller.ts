import { Data, Controller, InjectCtx, RequestContext, Post, Contract, UseGuards } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import { Api } from 'bwcx-api';
import { ApiController } from '@server/decorators';
import NewsService from './news.service';
import LoginGuard from '@server/guards/login';
import {
  CreateNewsReqDTO,
  UpdateNewsReqDTO,
  DeleteNewsReqDTO,
  GetNewsDetailResDTO,
  GetNewsListResDTO,
  GetNewsReqDTO,
  GetPublishedNewsListReqDTO,
  GetPublishedNewsListResDTO,
  GetAllNewsReqDTO,
  GetAllNewsResDTO,
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
  @UseGuards(LoginGuard)
  public async createNews(@Data() data: CreateNewsReqDTO): Promise<void> {
    await this.newsService.createNews(data);
  }

  @Api.Summary('更新新闻')
  @Post('/updateNews')
  @Contract(UpdateNewsReqDTO, null)
  @UseGuards(LoginGuard)
  public async updateNews(@Data() data: UpdateNewsReqDTO): Promise<void> {
    await this.newsService.updateNews(data);
  }

  @Api.Summary('删除新闻')
  @Post('/deleteNews')
  @Contract(DeleteNewsReqDTO, null)
  @UseGuards(LoginGuard)
  public async deleteNews(@Data() data: DeleteNewsReqDTO): Promise<void> {
    await this.newsService.deleteNews(data);
  }

  @Api.Summary('获取新闻详情（管理员用）')
  @Post('/getNews')
  @Contract(GetNewsReqDTO, GetNewsDetailResDTO)
  @UseGuards(LoginGuard)
  public async getNews(@Data() data: GetNewsReqDTO): Promise<GetNewsDetailResDTO> {
    return await this.newsService.getNews(data);
  }

  @Api.Summary('获取已发布新闻详情（普通用户用）')
  @Post('/getPublishedNews')
  @Contract(GetNewsReqDTO, GetNewsDetailResDTO)
  public async getPublishedNews(@Data() data: GetNewsReqDTO): Promise<GetNewsDetailResDTO> {
    return await this.newsService.getPublishedNews(data);
  }

  @Api.Summary('获取所有新闻列表（管理员用）')
  @Post('/getAllNews')
  @Contract(GetAllNewsReqDTO, GetAllNewsResDTO)
  @UseGuards(LoginGuard)
  public async getAllNews(@Data() data: GetAllNewsReqDTO): Promise<GetAllNewsResDTO> {
    return await this.newsService.getAllNews(data);
  }

  @Api.Summary('分页获取已发布新闻列表')
  @Post('/getPublishedNewsList')
  @Contract(GetPublishedNewsListReqDTO, GetPublishedNewsListResDTO)
  public async getPublishedNewsList(@Data() data: GetPublishedNewsListReqDTO): Promise<GetPublishedNewsListResDTO> {
    return await this.newsService.getPublishedNewsList(data);
  }
}
