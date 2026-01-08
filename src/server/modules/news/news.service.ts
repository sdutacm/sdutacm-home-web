import { Service, InjectCtx, RequestContext } from 'bwcx-ljsm';
import {
  CreateNewsReqDTO,
  UpdateNewsReqDTO,
  DeleteNewsReqDTO,
  GetNewsDetailResDTO,
  GetNewsListResDTO,
  GetNewsReqDTO,
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
      coverImage: data.coverImage,
      isPublished: data.isPublished || false,
      publishedAt: data.isPublished ? new Date() : null,
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
    const news = await newsRepo.findOne({ where: { id: data.id } });
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
    };
  }

  // 获取所有新闻列表
  public async getAllNews(): Promise<GetNewsListResDTO> {
    const newsRepo = appDataSource.getRepository(News);
    const newsList = await newsRepo.find({
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
      })),
    };
  }
}
