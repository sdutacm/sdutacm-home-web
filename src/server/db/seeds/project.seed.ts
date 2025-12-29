import { DataSource } from 'typeorm';
import { News } from '../entity/news';

export async function seedNews(ds: DataSource) {
  const repo = ds.getRepository(News);

  const count = await repo.count();
  if (count > 0) return;

  await repo.save([
    repo.create({
      title: 'SDUT ACM 成立',
      content: '...',
      isPublished: true,
      publishedAt: new Date(),
      coverImage: '/static/news/1.png',
    }),
    repo.create({
      title: '新生选拔开始',
      content: '...',
      isPublished: true,
      publishedAt: new Date(Date.now() - 86400000),
    }),
  ]);
}
