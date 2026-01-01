import { DataSource } from 'typeorm';
import { News } from '../entity/news';
import { HomeNewsPreview } from '../entity/home-news-preview';

export async function seedHomeNewsPreview(ds: DataSource) {
  const previewRepo = ds.getRepository(HomeNewsPreview);
  const newsRepo = ds.getRepository(News);

  // 幂等：已存在就不重复生成
  if (await previewRepo.count() > 0) return;

  const latestNews = await newsRepo.find({
    where: { isPublished: true },
    order: { publishedAt: 'DESC' },
    take: 5,
  });

  const previews = latestNews.map((news, index) =>
    previewRepo.create({
      news,
      previewImage: news.coverImage, // 默认复用封面
    })
  );

  await previewRepo.save(previews);
}
