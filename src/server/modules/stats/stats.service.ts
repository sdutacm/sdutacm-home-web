import { Service, InjectCtx, RequestContext } from 'bwcx-ljsm';
import appDataSource from '@server/db';
import { PageView } from '@server/db/entity/page-view';
import { DailyPageView } from '@server/db/entity/daily-page-view';
import { News } from '@server/db/entity/news';
import { Project } from '@server/db/entity/project';
import { Media } from '@server/db/entity/media';
import { Admin } from '@server/db/entity/admin';
import { GetOverviewStatsResDTO } from '@common/modules/stats/stats.dto';
import { MediaTypeEnum } from '@common/enums/media-type.enum';

@Service()
export default class StatsService {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
  ) {}

  // 获取今日日期字符串 YYYY-MM-DD
  private getTodayDateString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  // 增加页面浏览次数（同时更新总计和每日统计）
  public async incrementPageViewCount(pageKey: string): Promise<void> {
    const pageViewRepo = appDataSource.getRepository(PageView);
    const dailyPageViewRepo = appDataSource.getRepository(DailyPageView);
    const today = this.getTodayDateString();

    // 更新总计
    const result = await pageViewRepo.increment({ pageKey }, 'viewCount', 1);

    if (result.affected === 0) {
      const pageView = pageViewRepo.create({
        pageKey,
        viewCount: 1,
      });
      try {
        await pageViewRepo.save(pageView);
      } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
          await pageViewRepo.increment({ pageKey }, 'viewCount', 1);
        } else {
          throw error;
        }
      }
    }

    // 更新每日统计
    const dailyResult = await dailyPageViewRepo.increment({ pageKey, date: today }, 'viewCount', 1);

    if (dailyResult.affected === 0) {
      const dailyPageView = dailyPageViewRepo.create({
        pageKey,
        date: today,
        viewCount: 1,
      });
      try {
        await dailyPageViewRepo.save(dailyPageView);
      } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
          await dailyPageViewRepo.increment({ pageKey, date: today }, 'viewCount', 1);
        } else {
          throw error;
        }
      }
    }
  }

  // 获取页面浏览次数
  public async getPageViewCount(pageKey: string): Promise<number> {
    const pageViewRepo = appDataSource.getRepository(PageView);
    const pageView = await pageViewRepo.findOne({ where: { pageKey } });
    return pageView?.viewCount || 0;
  }

  // 获取所有页面浏览统计
  public async getAllPageViewStats(): Promise<{ pageKey: string; viewCount: number }[]> {
    const pageViewRepo = appDataSource.getRepository(PageView);
    const stats = await pageViewRepo.find();
    return stats.map((s) => ({ pageKey: s.pageKey, viewCount: s.viewCount }));
  }

  // 获取每日页面浏览统计（最近N天）
  public async getDailyPageViewStats(
    pageKey: string,
    days: number = 30,
  ): Promise<{ date: string; viewCount: number }[]> {
    const dailyPageViewRepo = appDataSource.getRepository(DailyPageView);

    // 计算起始日期
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const stats = await dailyPageViewRepo
      .createQueryBuilder('dpv')
      .where('dpv.page_key = :pageKey', { pageKey })
      .andWhere('dpv.date >= :startDate', { startDate: startDateStr })
      .andWhere('dpv.date <= :endDate', { endDate: endDateStr })
      .orderBy('dpv.date', 'ASC')
      .getMany();

    // 填充缺失的日期（访问量为0）
    const result: { date: string; viewCount: number }[] = [];
    const statsMap = new Map(stats.map((s) => [s.date, s.viewCount]));

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        viewCount: statsMap.get(dateStr) || 0,
      });
    }

    return result;
  }

  // 获取概览统计数据
  public async getOverviewStats(): Promise<GetOverviewStatsResDTO> {
    const pageViewRepo = appDataSource.getRepository(PageView);
    const dailyPageViewRepo = appDataSource.getRepository(DailyPageView);
    const newsRepo = appDataSource.getRepository(News);
    const projectRepo = appDataSource.getRepository(Project);
    const mediaRepo = appDataSource.getRepository(Media);
    const adminRepo = appDataSource.getRepository(Admin);
    const today = this.getTodayDateString();

    // 获取首页总访问量
    const homePageView = await pageViewRepo.findOne({ where: { pageKey: 'home' } });
    const totalHomeViews = homePageView?.viewCount || 0;

    // 获取今日首页访问量
    const todayHomePageView = await dailyPageViewRepo.findOne({
      where: { pageKey: 'home', date: today },
    });
    const todayHomeViews = todayHomePageView?.viewCount || 0;

    // 获取新闻统计
    const totalNewsCount = await newsRepo.count();
    const publishedNewsCount = await newsRepo.count({ where: { isPublished: true } });
    const draftNewsCount = totalNewsCount - publishedNewsCount;

    // 获取新闻总浏览量
    const newsViewsResult = await newsRepo
      .createQueryBuilder('news')
      .select('SUM(news.view_count)', 'total')
      .getRawOne();
    const totalNewsViews = parseInt(newsViewsResult?.total || '0', 10);

    // 获取项目统计
    const totalProjectCount = await projectRepo.count();
    const featuredProjectCount = await projectRepo.count({ where: { isFeatured: true } });

    // 获取媒体统计
    const totalMediaCount = await mediaRepo.count();
    const activeMediaCount = await mediaRepo.count({ where: { active: true } });
    const mediaSizeResult = await mediaRepo.createQueryBuilder('media').select('SUM(media.size)', 'total').getRawOne();
    const totalMediaSize = parseInt(mediaSizeResult?.total || '0', 10);

    // 获取媒体类型统计
    const logoCount = await mediaRepo.count({ where: { type: MediaTypeEnum.LOGO } });
    const imageCount = await mediaRepo.count({ where: { type: MediaTypeEnum.IMAGE } });
    const audioCount = await mediaRepo.count({ where: { type: MediaTypeEnum.AUDIO } });
    const videoCount = await mediaRepo.count({ where: { type: MediaTypeEnum.VIDEO } });

    // 获取管理员统计
    const totalAdminCount = await adminRepo.count();
    const activeAdminCount = await adminRepo.count({ where: { active: true } });

    return {
      totalHomeViews,
      todayHomeViews,
      totalNewsCount,
      publishedNewsCount,
      draftNewsCount,
      totalNewsViews,
      totalProjectCount,
      featuredProjectCount,
      totalMediaCount,
      activeMediaCount,
      totalMediaSize,
      logoCount,
      imageCount,
      audioCount,
      videoCount,
      totalAdminCount,
      activeAdminCount,
    };
  }
}
