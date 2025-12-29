import { DataSource } from 'typeorm';
import { News } from '../entity/news';

export async function seedNews(ds: DataSource) {
  const repo = ds.getRepository(News);

  const count = await repo.count();
  if (count > 0) return;

  await repo.save([
    repo.create({
      title: 'SDUTACM第十七届校赛圆满结束',
      summary: '让我们一起回望比赛期间的精彩瞬间吧！',
      content: '...',
      isPublished: true,
      publishedAt: new Date(),
      coverImage: 'sdutacm-homepage-news-7.png',
    }),
    repo.create({
      title: '再创佳绩！山东省赛燃情开赛，代码争锋智启未来',
      summary: '我校学子在2025山东省赛斩获2金3银3铜！',
      content: '...',
      isPublished: true,
      publishedAt: new Date(Date.now() - 86400000),
      coverImage: 'sdutacm-homepage-news-6.png',
    }),
    repo.create({
      title: 'SDUT 第十六届 ACM 网络编程擂台赛圆满结束！🏆',
      summary: '点此进入 SDUTPMC 精彩瞬间。',
      content: '...',
      isPublished: true,
      publishedAt: new Date(Date.now() - 2 * 86400000),
      coverImage: 'sdutacm-homepage-news-5.png',
    }),
    repo.create({
      title: '芜湖🐱 起飞🛫',
      summary: '欢迎解锁 9#409 撸猫现场😽！',
      content: '...',
      isPublished: true,
      publishedAt: new Date(Date.now() - 3 * 86400000),
      coverImage: 'sdutacm-homepage-news-4.png',
    }),
    repo.create({
      title: 'SDUTACM 第十六届校赛圆满结束',
      summary: '让我们一起回望比赛期间的精彩瞬间吧！',
      content: '...',
      isPublished: true,
      publishedAt: new Date(Date.now() - 4 * 86400000),
      coverImage: 'sdutacm-homepage-news-16th.png',
    }),
  ]);
}
