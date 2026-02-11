import { Service, InjectCtx, RequestContext } from 'bwcx-ljsm';
import appDataSource from '@server/db';
import { PageView } from '@server/db/entity/page-view';

@Service()
export default class StatsService {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
  ) {}

  // 增加页面浏览次数
  public async incrementPageViewCount(pageKey: string): Promise<void> {
    const pageViewRepo = appDataSource.getRepository(PageView);

    // 尝试先更新已存在的记录
    const result = await pageViewRepo.increment({ pageKey }, 'viewCount', 1);

    // 如果没有更新任何记录，说明记录不存在，需要创建
    if (result.affected === 0) {
      const pageView = pageViewRepo.create({
        pageKey,
        viewCount: 1,
      });
      try {
        await pageViewRepo.save(pageView);
      } catch (error: any) {
        // 如果是唯一键冲突，说明其他请求已经创建了记录，再次尝试更新
        if (error.code === 'ER_DUP_ENTRY') {
          await pageViewRepo.increment({ pageKey }, 'viewCount', 1);
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
    return stats.map(s => ({ pageKey: s.pageKey, viewCount: s.viewCount }));
  }
}
