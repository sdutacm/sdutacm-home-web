import { Service, InjectCtx, RequestContext } from 'bwcx-ljsm';
import {
  CreateNewsReqDTO,
  UpdateNewsReqDTO,
  DeleteNewsReqDTO,
  GetNewsDetailResDTO,
  GetNewsListResDTO,
  GetNewsReqDTO,
  GetPublishedNewsListReqDTO,
  GetPublishedNewsListResDTO,
} from '@common/modules/news/news.dto';
import appDataSource from '@server/db';
import { News } from '@server/db/entity/news';

@Service()
export default class NewsService {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
  ) {}

  // 创建新闻
  public async createNews(data: CreateNewsReqDTO): Promise<void> {
    const newsRepo = appDataSource.getRepository(News);

    const news = newsRepo.create({
      title: data.title,
      summary: data.summary,
      content: data.content,
      coverImage: data.coverImage || '',
      isPublished: data.isPublished || false,
      publishedAt: data.isPublished ? new Date() : null,
      updatedBy: this.ctx.session.admin,
    });

    await newsRepo.save(news);
  }

  // 更新新闻
  public async updateNews(data: UpdateNewsReqDTO): Promise<void> {
    const newsRepo = appDataSource.getRepository(News);
    const news = await newsRepo.findOne({ where: { id: data.id } });
    if (!news) {
      throw new Error('新闻不存在');
    }

    if (data.title !== undefined) news.title = data.title;
    if (data.summary !== undefined) news.summary = data.summary;
    if (data.content !== undefined) news.content = data.content;
    if (data.coverImage !== undefined) news.coverImage = data.coverImage;

    // 设置更新人
    news.updatedBy = this.ctx.session.admin;

    // 如果从未发布变为发布，设置发布时间
    if (data.isPublished !== undefined) {
      if (data.isPublished && !news.isPublished) {
        news.publishedAt = new Date();
      }
      news.isPublished = data.isPublished;
    }

    await newsRepo.save(news);
  }

  // 删除新闻
  public async deleteNews(data: DeleteNewsReqDTO): Promise<void> {
    const newsRepo = appDataSource.getRepository(News);
    const news = await newsRepo.findOne({ where: { id: data.id } });
    if (!news) {
      throw new Error('新闻不存在');
    }

    await newsRepo.remove(news);
  }

  // 获取新闻详情
  public async getNews(data: GetNewsReqDTO): Promise<GetNewsDetailResDTO> {
    const newsRepo = appDataSource.getRepository(News);
    const news = await newsRepo.findOne({
      where: { id: data.id },
      relations: ['updatedBy'],
    });
    if (!news) {
      throw new Error('新闻不存在');
    }

    return {
      id: news.id,
      title: news.title,
      summary: news.summary,
      content: news.content,
      coverImage: news.coverImage,
      isPublished: news.isPublished,
      publishedAt: news.publishedAt,
      createdAt: news.createdAt,
      updatedAt: news.updatedAt,
      viewCount: news.viewCount,
      updatedBy: news.updatedBy
        ? {
            id: news.updatedBy.id,
            username: news.updatedBy.username,
            avatar: news.updatedBy.avatar,
          }
        : undefined,
    };
  }

  // 获取所有新闻列表
  public async getAllNews(): Promise<GetNewsListResDTO> {
    const newsRepo = appDataSource.getRepository(News);
    const newsList = await newsRepo.find({
      relations: ['updatedBy'],
      order: { createdAt: 'DESC' },
    });

    return {
      rows: newsList.map(news => ({
        id: news.id,
        title: news.title,
        summary: news.summary,
        content: news.content,
        coverImage: news.coverImage,
        isPublished: news.isPublished,
        publishedAt: news.publishedAt,
        createdAt: news.createdAt,
        updatedAt: news.updatedAt,
        viewCount: news.viewCount,
        updatedBy: news.updatedBy
          ? {
              id: news.updatedBy.id,
              username: news.updatedBy.username,
              avatar: news.updatedBy.avatar,
            }
          : undefined,
      })),
    };
  }

  // 分页获取已发布的新闻列表
  public async getPublishedNewsList(data: GetPublishedNewsListReqDTO): Promise<GetPublishedNewsListResDTO> {
    const newsRepo = appDataSource.getRepository(News);
    const { page, pageSize } = data;
    const skip = (page - 1) * pageSize;

    const [newsList, total] = await newsRepo.findAndCount({
      where: { isPublished: true },
      relations: ['updatedBy'],
      order: { publishedAt: 'DESC' },
      skip,
      take: pageSize,
    });

    return {
      rows: newsList.map(news => ({
        id: news.id,
        title: news.title,
        summary: news.summary,
        content: news.content,
        coverImage: news.coverImage,
        isPublished: news.isPublished,
        publishedAt: news.publishedAt,
        createdAt: news.createdAt,
        updatedAt: news.updatedAt,
        viewCount: news.viewCount,
        updatedBy: news.updatedBy
          ? {
              id: news.updatedBy.id,
              username: news.updatedBy.username,
              avatar: news.updatedBy.avatar,
            }
          : undefined,
      })),
      total,
      page,
      pageSize,
      hasMore: skip + newsList.length < total,
    };
  }

  // 增加新闻浏览次数
  public async incrementViewCount(newsId: number): Promise<void> {
    const newsRepo = appDataSource.getRepository(News);
    await newsRepo.increment({ id: newsId }, 'viewCount', 1);
  }

  // 获取新闻浏览次数
  public async getViewCount(newsId: number): Promise<number> {
    const newsRepo = appDataSource.getRepository(News);
    const news = await newsRepo.findOne({ where: { id: newsId }, select: ['viewCount'] });
    return news?.viewCount || 0;
  }
}
