import { Service, InjectCtx, RequestContext } from 'bwcx-ljsm';
import { GetHomeDataResDTO } from '@common/modules/home/home.dto';
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
        relations: ['logo'],
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

      const projectPreviews = await projectPreviewRepo.find({
        where: { visible: true },
        relations: ['project'],
      });

      const res: GetHomeDataResDTO = {
        title: globalConfig.title,
        slogan: globalConfig.slogan,
        description: globalConfig.description,
        logo: {
          id: globalConfig.logo.id,
          path: globalConfig.logo.path,
          type: globalConfig.logo.type,
          alt: globalConfig.logo.alt,
          active: globalConfig.logo.active,
          createdAt: globalConfig.logo.createdAt,
        },
        newsPreview: newsPreviews.map((preview) => ({
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
        })),
      };
      return res;
    } catch (error) {
      console.error('Get home data failed:', error);
      throw error;
    }
  }
}

