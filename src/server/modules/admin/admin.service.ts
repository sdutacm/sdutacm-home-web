import { Service, InjectCtx, RequestContext } from 'bwcx-ljsm';
import { GetGlobalConfigResDTO, UpdateGlobalConfigReqDTO } from '@common/modules/global-config/global-config.dto';
import appDataSource from '@server/db';
import { GlobalConfig } from '@server/db/entity/global-config';
import { MediaTypeEnum } from '@common/enums/media-type.enum';
import { Media } from '@server/db/entity/media';
import { HomeNewsPreview } from '@server/db/entity/home-news-preview';
import { News } from '@server/db/entity/news';
import { HomeProjectsPreview } from '@server/db/entity/home-projects-preview';
import { Project } from '@server/db/entity/project';

@Service()
export default class AdminService {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
  ) {}

  /** methods */
  public async getGlobalConfig(): Promise<GetGlobalConfigResDTO> {
    try {
      const globalConfigRepo = appDataSource.getRepository(GlobalConfig);
      const configs = await globalConfigRepo.find({
        relations: ['logo'],
        take: 1,
      });

      const config = configs[0];

      // 获取首页新闻预览列表
      const homeNewsPreviewRepo = appDataSource.getRepository(HomeNewsPreview);
      const homeNewsPreviews = await homeNewsPreviewRepo.find({
        relations: ['news'],
        where: { visible: true },
        take: 5,
      });

      // 获取首页项目预览列表
      const homeProjectsPreviewRepo = appDataSource.getRepository(HomeProjectsPreview);
      const homeProjectsPreviews = await homeProjectsPreviewRepo.find({
        relations: ['project'],
        where: { visible: true },
        take: 3,
      });

      const res: GetGlobalConfigResDTO = {
        title: config.title,
        slogan: config.slogan,
        description: config.description,
        logoUrl: config.logo ? config.logo.path : '',
        homeNewsPreviewIds: homeNewsPreviews.map(preview => preview.news.id),
        homeProjectsPreviewIds: homeProjectsPreviews.map(preview => preview.project.id),
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      };
      return res;
    } catch (error) {
      console.error('Error fetching global config:', error);
      throw error;
    }
  }

  public async updateGlobalConfig(data: UpdateGlobalConfigReqDTO): Promise<void> {
    const globalConfigRepo = appDataSource.getRepository(GlobalConfig);
    const config = await globalConfigRepo.findOne({
      where: {},
      relations: ['logo'],
    });

    if (!config) {
      throw new Error('Global config not found');
    }

    config.title = data.title;
    config.slogan = data.slogan;
    config.description = data.description;

    // 只有明确传递了 logoId 时才更新 logo
    if (data.logoId !== undefined && data.logoId !== null) {
      const mediaRepo = appDataSource.getRepository(Media);
      const logo = await mediaRepo.findOneBy({ id: data.logoId });
      if (!logo) {
        throw new Error('Logo media not found');
      }
      config.logo = logo;
    }

    // 处理首页新闻预览 (必须恰好5条)
    if (data.homeNewsPreviewIds !== undefined) {
      const homeNewsPreviewRepo = appDataSource.getRepository(HomeNewsPreview);
      const newsRepo = appDataSource.getRepository(News);

      // 验证必须选择恰好5条
      if (data.homeNewsPreviewIds.length !== 5) {
        throw new Error('首页新闻预览必须选择恰好5条');
      }

      // 清空现有的所有首页新闻预览
      const existingPreviews = await homeNewsPreviewRepo.find();
      if (existingPreviews.length > 0) {
        await homeNewsPreviewRepo.remove(existingPreviews);
      }

      // 添加新的首页新闻预览 (必须5条)
      const newsIds = data.homeNewsPreviewIds;
      for (const newsId of newsIds) {
        const news = await newsRepo.findOne({ where: { id: newsId, isPublished: true } });
        if (!news) {
          throw new Error(`新闻 ${newsId} 不存在或未发布，无法添加到首页展示`);
        }
        const preview = homeNewsPreviewRepo.create({
          news: news,
          visible: true,
        });
        await homeNewsPreviewRepo.save(preview);
      }
    }

    // 处理首页项目预览 (必须恰好3条)
    if (data.homeProjectsPreviewIds !== undefined) {
      const homeProjectsPreviewRepo = appDataSource.getRepository(HomeProjectsPreview);
      const projectRepo = appDataSource.getRepository(Project);

      // 验证必须选择恰好3条
      if (data.homeProjectsPreviewIds.length !== 3) {
        throw new Error('首页项目预览必须选择恰好3条');
      }

      // 清空现有的所有首页项目预览
      const existingPreviews = await homeProjectsPreviewRepo.find();
      if (existingPreviews.length > 0) {
        await homeProjectsPreviewRepo.remove(existingPreviews);
      }

      // 添加新的首页项目预览 (必须3条)
      const projectIds = data.homeProjectsPreviewIds;
      for (const projectId of projectIds) {
        const project = await projectRepo.findOne({ where: { id: projectId } });
        if (!project) {
          throw new Error(`项目 ${projectId} 不存在，无法添加到首页展示`);
        }
        const preview = homeProjectsPreviewRepo.create({
          project: project,
          visible: true,
        });
        await homeProjectsPreviewRepo.save(preview);
      }
    }

    await globalConfigRepo.save(config);
  }
}
