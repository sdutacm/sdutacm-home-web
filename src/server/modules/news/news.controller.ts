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
  CreateNewsCategoryReqDTO,
  UpdateNewsCategoryReqDTO,
  DeleteNewsCategoryReqDTO,
  GetNewsCategoryReqDTO,
  GetNewsCategoryResDTO,
  GetAllNewsCategoriesResDTO,
  GetVisibleNewsCategoriesResDTO,
  SetNewsCategoryReqDTO,
  BatchSetNewsCategoryReqDTO,
  GetNewsByCategoryReqDTO,
  GetNewsByCategoryResDTO,
  GetCategoryPreviewReqDTO,
  GetCategoryPreviewResDTO,
  GetAllCategoriesPreviewResDTO,
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

  @Api.Summary('增加新闻阅览数')
  @Post('/incrementNewsViewCount')
  @Contract(GetNewsReqDTO, null)
  public async incrementNewsViewCount(@Data() data: GetNewsReqDTO): Promise<void> {
    await this.newsService.incrementViewCount(data.id);
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

  // ==================== 栏目管理接口 ====================

  @Api.Summary('创建新闻栏目')
  @Post('/createCategory')
  @Contract(CreateNewsCategoryReqDTO, null)
  @UseGuards(LoginGuard)
  public async createCategory(@Data() data: CreateNewsCategoryReqDTO): Promise<void> {
    await this.newsService.createCategory(data);
  }

  @Api.Summary('更新新闻栏目')
  @Post('/updateCategory')
  @Contract(UpdateNewsCategoryReqDTO, null)
  @UseGuards(LoginGuard)
  public async updateCategory(@Data() data: UpdateNewsCategoryReqDTO): Promise<void> {
    await this.newsService.updateCategory(data);
  }

  @Api.Summary('删除新闻栏目')
  @Post('/deleteCategory')
  @Contract(DeleteNewsCategoryReqDTO, null)
  @UseGuards(LoginGuard)
  public async deleteCategory(@Data() data: DeleteNewsCategoryReqDTO): Promise<void> {
    await this.newsService.deleteCategory(data);
  }

  @Api.Summary('获取单个新闻栏目（管理员用）')
  @Post('/getCategory')
  @Contract(GetNewsCategoryReqDTO, GetNewsCategoryResDTO)
  @UseGuards(LoginGuard)
  public async getCategory(@Data() data: GetNewsCategoryReqDTO): Promise<GetNewsCategoryResDTO> {
    return await this.newsService.getCategory(data);
  }

  @Api.Summary('获取所有新闻栏目列表（管理员用）')
  @Post('/getAllCategories')
  @Contract(null, GetAllNewsCategoriesResDTO)
  @UseGuards(LoginGuard)
  public async getAllCategories(): Promise<GetAllNewsCategoriesResDTO> {
    return await this.newsService.getAllCategories();
  }

  @Api.Summary('获取可见新闻栏目列表（前台用）')
  @Post('/getVisibleCategories')
  @Contract(null, GetVisibleNewsCategoriesResDTO)
  public async getVisibleCategories(): Promise<GetVisibleNewsCategoriesResDTO> {
    return await this.newsService.getVisibleCategories();
  }

  @Api.Summary('设置新闻栏目')
  @Post('/setNewsCategory')
  @Contract(SetNewsCategoryReqDTO, null)
  @UseGuards(LoginGuard)
  public async setNewsCategory(@Data() data: SetNewsCategoryReqDTO): Promise<void> {
    await this.newsService.setNewsCategory(data);
  }

  @Api.Summary('批量设置新闻栏目')
  @Post('/batchSetNewsCategory')
  @Contract(BatchSetNewsCategoryReqDTO, null)
  @UseGuards(LoginGuard)
  public async batchSetNewsCategory(@Data() data: BatchSetNewsCategoryReqDTO): Promise<void> {
    await this.newsService.batchSetNewsCategory(data);
  }

  @Api.Summary('按栏目获取新闻列表')
  @Post('/getNewsByCategory')
  @Contract(GetNewsByCategoryReqDTO, GetNewsByCategoryResDTO)
  public async getNewsByCategory(@Data() data: GetNewsByCategoryReqDTO): Promise<GetNewsByCategoryResDTO> {
    return await this.newsService.getNewsByCategory(data);
  }

  @Api.Summary('获取栏目预览数据（前台大卡片用）')
  @Post('/getCategoryPreview')
  @Contract(GetCategoryPreviewReqDTO, GetCategoryPreviewResDTO)
  public async getCategoryPreview(@Data() data: GetCategoryPreviewReqDTO): Promise<GetCategoryPreviewResDTO> {
    return await this.newsService.getCategoryPreview(data);
  }

  @Api.Summary('获取所有栏目预览数据（首页用）')
  @Post('/getAllCategoriesPreview')
  @Contract(null, GetAllCategoriesPreviewResDTO)
  public async getAllCategoriesPreview(): Promise<GetAllCategoriesPreviewResDTO> {
    return await this.newsService.getAllCategoriesPreview();
  }
}
