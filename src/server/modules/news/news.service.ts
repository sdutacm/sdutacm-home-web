import { Service, InjectCtx, RequestContext } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
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
  NewsCategoryVO,
} from '@common/modules/news/news.dto';
import appDataSource from '@server/db';
import { News } from '@server/db/entity/news';
import { NewsCategory } from '@server/db/entity/news-category';
import AuditService from '@server/modules/audit/audit.service';
import { In } from 'typeorm';

@Service()
export default class NewsService {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
    @Inject()
    private readonly auditService: AuditService,
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
      categoryId: data.categoryId || null,
    });

    const savedNews = await newsRepo.save(news);

    // 记录审计日志和创建版本
    await this.auditService.logCreate('news', savedNews.id, savedNews.title, {
      title: savedNews.title,
      summary: savedNews.summary,
      content: savedNews.content,
      coverImage: savedNews.coverImage,
      isPublished: savedNews.isPublished,
      publishedAt: savedNews.publishedAt,
      categoryId: savedNews.categoryId,
    });
  }

  // 更新新闻
  public async updateNews(data: UpdateNewsReqDTO): Promise<void> {
    const newsRepo = appDataSource.getRepository(News);
    const news = await newsRepo.findOne({ where: { id: data.id }, relations: ['category'] });
    if (!news) {
      throw new Error('新闻不存在');
    }

    // 保存旧数据用于审计
    const oldData = {
      title: news.title,
      summary: news.summary,
      content: news.content,
      coverImage: news.coverImage,
      isPublished: news.isPublished,
      publishedAt: news.publishedAt,
      categoryId: news.categoryId,
    };

    if (data.title !== undefined) news.title = data.title;
    if (data.summary !== undefined) news.summary = data.summary;
    if (data.content !== undefined) news.content = data.content;
    if (data.coverImage !== undefined) news.coverImage = data.coverImage;

    // 处理栏目更新 - 直接设置外键字段
    if (data.categoryId !== undefined) {
      if (data.categoryId === null || data.categoryId === 0) {
        news.categoryId = null;
      } else {
        news.categoryId = data.categoryId;
      }
    }

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

    // 记录审计日志和创建新版本
    const newData = {
      title: news.title,
      summary: news.summary,
      content: news.content,
      coverImage: news.coverImage,
      isPublished: news.isPublished,
      publishedAt: news.publishedAt,
      categoryId: news.category?.id,
    };
    await this.auditService.logUpdate('news', news.id, news.title, oldData, newData);
  }

  // 删除新闻
  public async deleteNews(data: DeleteNewsReqDTO): Promise<void> {
    const newsRepo = appDataSource.getRepository(News);
    const news = await newsRepo.findOne({ where: { id: data.id } });
    if (!news) {
      throw new Error('新闻不存在');
    }

    // 保存删除前的数据用于审计
    const oldData = {
      title: news.title,
      summary: news.summary,
      content: news.content,
      coverImage: news.coverImage,
      isPublished: news.isPublished,
      publishedAt: news.publishedAt,
    };

    // 记录删除日志并标记版本为已删除
    await this.auditService.logDelete('news', news.id, news.title, oldData);

    await newsRepo.remove(news);
  }

  // 获取新闻详情（管理员用，可获取任何新闻）
  public async getNews(data: GetNewsReqDTO): Promise<GetNewsDetailResDTO> {
    const newsRepo = appDataSource.getRepository(News);
    const news = await newsRepo.findOne({
      where: { id: data.id },
      relations: ['updatedBy', 'category'],
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
      categoryId: news.category?.id,
      categoryName: news.category?.name,
      updatedBy: news.updatedBy
        ? {
            id: news.updatedBy.id,
            username: news.updatedBy.username,
            avatar: news.updatedBy.avatar,
          }
        : undefined,
    };
  }

  // 获取已发布新闻详情（普通用户用，只能获取已发布的新闻）
  public async getPublishedNews(data: GetNewsReqDTO): Promise<GetNewsDetailResDTO> {
    const newsRepo = appDataSource.getRepository(News);
    const news = await newsRepo.findOne({
      where: { id: data.id, isPublished: true },
      relations: ['updatedBy'],
    });
    if (!news) {
      throw new Error('新闻不存在或未发布');
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

  // 获取所有新闻列表（管理员用，支持分页）
  public async getAllNews(data?: GetAllNewsReqDTO): Promise<GetAllNewsResDTO> {
    const newsRepo = appDataSource.getRepository(News);
    const page = data?.page || 1;
    const pageSize = data?.pageSize || 35;
    const skip = (page - 1) * pageSize;

    const [newsList, total] = await newsRepo.findAndCount({
      relations: ['updatedBy', 'category'],
      order: { createdAt: 'DESC' },
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
        categoryId: news.category?.id,
        categoryName: news.category?.name,
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

  // ==================== 栏目管理方法 ====================

  // 创建栏目
  public async createCategory(data: CreateNewsCategoryReqDTO): Promise<void> {
    const categoryRepo = appDataSource.getRepository(NewsCategory);

    const category = categoryRepo.create({
      name: data.name,
      description: data.description,
      coverImage: data.coverImage,
      order: data.order ?? 0,
      isVisible: data.isVisible ?? true,
    });

    const savedCategory = await categoryRepo.save(category);

    await this.auditService.logCreate('news_category', savedCategory.id, savedCategory.name, {
      name: savedCategory.name,
      description: savedCategory.description,
      coverImage: savedCategory.coverImage,
      order: savedCategory.order,
      isVisible: savedCategory.isVisible,
    });
  }

  // 更新栏目
  public async updateCategory(data: UpdateNewsCategoryReqDTO): Promise<void> {
    const categoryRepo = appDataSource.getRepository(NewsCategory);
    const category = await categoryRepo.findOne({ where: { id: data.id } });
    if (!category) {
      throw new Error('栏目不存在');
    }

    const oldData = {
      name: category.name,
      description: category.description,
      coverImage: category.coverImage,
      order: category.order,
      isVisible: category.isVisible,
    };

    if (data.name !== undefined) category.name = data.name;
    if (data.description !== undefined) category.description = data.description;
    if (data.coverImage !== undefined) category.coverImage = data.coverImage;
    if (data.order !== undefined) category.order = data.order;
    if (data.isVisible !== undefined) category.isVisible = data.isVisible;

    await categoryRepo.save(category);

    const newData = {
      name: category.name,
      description: category.description,
      coverImage: category.coverImage,
      order: category.order,
      isVisible: category.isVisible,
    };
    await this.auditService.logUpdate('news_category', category.id, category.name, oldData, newData);
  }

  // 删除栏目
  public async deleteCategory(data: DeleteNewsCategoryReqDTO): Promise<void> {
    const categoryRepo = appDataSource.getRepository(NewsCategory);
    const category = await categoryRepo.findOne({ where: { id: data.id } });
    if (!category) {
      throw new Error('栏目不存在');
    }

    // 将该栏目下的新闻的 category 设为 null
    const newsRepo = appDataSource.getRepository(News);
    await newsRepo.update({ category: { id: data.id } }, { category: null });

    const oldData = {
      name: category.name,
      description: category.description,
      coverImage: category.coverImage,
      order: category.order,
      isVisible: category.isVisible,
    };

    await this.auditService.logDelete('news_category', category.id, category.name, oldData);
    await categoryRepo.remove(category);
  }

  // 获取单个栏目
  public async getCategory(data: GetNewsCategoryReqDTO): Promise<GetNewsCategoryResDTO> {
    const categoryRepo = appDataSource.getRepository(NewsCategory);
    const category = await categoryRepo.findOne({
      where: { id: data.id },
      relations: ['news'],
    });
    if (!category) {
      throw new Error('栏目不存在');
    }

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      coverImage: category.coverImage,
      order: category.order,
      isVisible: category.isVisible,
      newsCount: category.news?.length || 0,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  // 获取所有栏目列表（管理员用）
  public async getAllCategories(): Promise<GetAllNewsCategoriesResDTO> {
    const categoryRepo = appDataSource.getRepository(NewsCategory);
    const categories = await categoryRepo.find({
      relations: ['news'],
      order: { order: 'ASC', createdAt: 'DESC' },
    });

    return {
      rows: categories.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        coverImage: category.coverImage,
        order: category.order,
        isVisible: category.isVisible,
        newsCount: category.news?.length || 0, // 管理后台统计所有新闻
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      })),
    };
  }

  // 获取可见栏目列表（前台用）
  public async getVisibleCategories(): Promise<GetVisibleNewsCategoriesResDTO> {
    const categoryRepo = appDataSource.getRepository(NewsCategory);
    const categories = await categoryRepo.find({
      where: { isVisible: true },
      relations: ['news'],
      order: { order: 'ASC', createdAt: 'DESC' },
    });

    return {
      rows: categories.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        coverImage: category.coverImage,
        order: category.order,
        isVisible: category.isVisible,
        newsCount: category.news?.filter(n => n.isPublished).length || 0,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      })),
    };
  }

  // 设置单个新闻的栏目
  public async setNewsCategory(data: SetNewsCategoryReqDTO): Promise<void> {
    const newsRepo = appDataSource.getRepository(News);
    const news = await newsRepo.findOne({ where: { id: data.newsId } });
    if (!news) {
      throw new Error('新闻不存在');
    }

    if (data.categoryId) {
      const categoryRepo = appDataSource.getRepository(NewsCategory);
      const category = await categoryRepo.findOne({ where: { id: data.categoryId } });
      if (!category) {
        throw new Error('栏目不存在');
      }
      news.categoryId = data.categoryId;
    } else {
      news.categoryId = null;
    }

    await newsRepo.save(news);
  }

  // 批量设置新闻的栏目
  public async batchSetNewsCategory(data: BatchSetNewsCategoryReqDTO): Promise<void> {
    const newsRepo = appDataSource.getRepository(News);

    if (data.categoryId) {
      const categoryRepo = appDataSource.getRepository(NewsCategory);
      const category = await categoryRepo.findOne({ where: { id: data.categoryId } });
      if (!category) {
        throw new Error('栏目不存在');
      }
      await newsRepo.update({ id: In(data.newsIds) }, { categoryId: data.categoryId });
    } else {
      await newsRepo.update({ id: In(data.newsIds) }, { categoryId: null });
    }
  }

  // 按栏目获取新闻列表
  public async getNewsByCategory(data: GetNewsByCategoryReqDTO): Promise<GetNewsByCategoryResDTO> {
    const categoryRepo = appDataSource.getRepository(NewsCategory);
    const category = await categoryRepo.findOne({ where: { id: data.categoryId } });
    if (!category) {
      throw new Error('栏目不存在');
    }

    const newsRepo = appDataSource.getRepository(News);
    const page = data.page || 1;
    const pageSize = data.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const [newsList, total] = await newsRepo.findAndCount({
      where: { category: { id: data.categoryId }, isPublished: true },
      relations: ['updatedBy'],
      order: { publishedAt: 'DESC' },
      skip,
      take: pageSize,
    });

    return {
      category: {
        id: category.id,
        name: category.name,
        description: category.description,
        coverImage: category.coverImage,
        order: category.order,
        isVisible: category.isVisible,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
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

  // 获取栏目预览数据（前台大卡片用）
  public async getCategoryPreview(data: GetCategoryPreviewReqDTO): Promise<GetCategoryPreviewResDTO> {
    const categoryRepo = appDataSource.getRepository(NewsCategory);
    const category = await categoryRepo.findOne({ where: { id: data.categoryId, isVisible: true } });
    if (!category) {
      throw new Error('栏目不存在或不可见');
    }

    const newsRepo = appDataSource.getRepository(News);
    const cardNewsCount = data.cardNewsCount || 3;
    const listNewsCount = data.listNewsCount || 5;

    // 获取总新闻数
    const totalNewsCount = await newsRepo.count({
      where: { category: { id: data.categoryId }, isPublished: true },
    });

    // 获取卡片展示的新闻（前几条）
    const cardNews = await newsRepo.find({
      where: { category: { id: data.categoryId }, isPublished: true },
      relations: ['updatedBy'],
      order: { publishedAt: 'DESC' },
      take: cardNewsCount,
    });

    // 获取列表展示的新闻（跳过卡片新闻）
    const listNews = await newsRepo.find({
      where: { category: { id: data.categoryId }, isPublished: true },
      relations: ['updatedBy'],
      order: { publishedAt: 'DESC' },
      skip: cardNewsCount,
      take: listNewsCount,
    });

    const mapNews = (news: News) => ({
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
    });

    return {
      category: {
        id: category.id,
        name: category.name,
        description: category.description,
        coverImage: category.coverImage,
        order: category.order,
        isVisible: category.isVisible,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
      cardNews: cardNews.map(mapNews),
      listNews: listNews.map(mapNews),
      totalNewsCount,
    };
  }

  // 获取所有栏目预览数据（首页用）
  public async getAllCategoriesPreview(): Promise<GetAllCategoriesPreviewResDTO> {
    const categoryRepo = appDataSource.getRepository(NewsCategory);
    const categories = await categoryRepo.find({
      where: { isVisible: true },
      order: { order: 'ASC', createdAt: 'DESC' },
    });

    const previews: GetCategoryPreviewResDTO[] = [];
    for (const category of categories) {
      const preview = await this.getCategoryPreview({
        categoryId: category.id,
        cardNewsCount: 3,
        listNewsCount: 5,
      });
      previews.push(preview);
    }

    return { categories: previews };
  }
}
