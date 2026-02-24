import { Service, InjectCtx, RequestContext } from 'bwcx-ljsm';
import { GetHomeDataResDTO, GetHomeNewsResDTO } from '@common/modules/home/home.dto';
import appDataSource from '@server/db';
import { GlobalConfig } from '@server/db/entity/global-config';
import { HomeNewsPreview } from '@server/db/entity/home-news-preview';
import { HomeProjectsPreview } from '@server/db/entity/home-projects-preview';


@Service()
export default class HomeService  {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
  ) {}

  /** methods */
  public async getHomeData(): Promise<GetHomeDataResDTO> {
    try {
      const globalConfigRepo = appDataSource.getRepository(GlobalConfig);
      const projectPreviewRepo = appDataSource.getRepository(HomeProjectsPreview);
      const newsPreviewRepo = appDataSource.getRepository(HomeNewsPreview);

      const globalConfigs = await globalConfigRepo.find({
        take: 1,
      });

      if (!globalConfigs || globalConfigs.length === 0) {
        throw new Error('Global config not found');
      }

      const globalConfig = globalConfigs[0];

      const newsPreviews = await newsPreviewRepo.find({
        where: { visible: true },
        relations: ['news'],
      });

      // 过滤掉未发布的新闻
      const publishedNewsPreviews = newsPreviews.filter(preview => preview.news.isPublished);

      const projectPreviews = await projectPreviewRepo.find({
        where: { visible: true },
        relations: ['project'],
      });

      const res: GetHomeDataResDTO = {
        title: globalConfig.title,
        slogan: globalConfig.slogan,
        description: globalConfig.description,
        logoPath: globalConfig.logoPath || '',
        newsPreview: publishedNewsPreviews.map((preview) => ({
          id: preview.news.id,
          title: preview.news.title,
          summary: preview.news.summary,
          coverImage: preview.news.coverImage,
          publishedAt: preview.news.publishedAt,
          content: preview.news.content,
        })),
        projectsPreview: projectPreviews.map((preview) => ({
          name: preview.project.name,
          description: preview.project.description,
          repoUrl: preview.project.repoUrl,
          websiteUrl: preview.project.websiteUrl,
          coverImage: preview.project.coverImage,
          bgColor: preview.project.bgColor,
        })),
      };
      return res;
    } catch (error) {
      console.error('Get home data failed:', error);
      throw error;
    }
  }

  async getHomeNews(): Promise<GetHomeNewsResDTO> {
    try {
      const newsPreviewRepo = appDataSource.getRepository(HomeNewsPreview);
      const newsPreviews = await newsPreviewRepo.find({
        where: { visible: true },
        relations: ['news'],
      });

      const publishedNewsPreviews = newsPreviews.filter(preview => preview.news.isPublished);

      const res: GetHomeNewsResDTO = {
        rows: publishedNewsPreviews.map((preview) => ({
          id: preview.news.id,
          title: preview.news.title,
          summary: preview.news.summary,
          coverImage: preview.news.coverImage,
          publishedAt: preview.news.publishedAt,
          content: preview.news.content,
        })),
      };
      return res;
    } catch (error) {
      console.error('Get home news failed:', error);
      throw error;
    }
  }
}

