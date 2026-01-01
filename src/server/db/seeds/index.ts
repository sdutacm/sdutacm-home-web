import appDataSource from '..';
import { seedGlobalConfig } from './global.seed';
import { seedNews } from './news.seed';
import { seedProjects } from './project.seed';

export async function runSeed() {
  await appDataSource.initialize();
  await seedGlobalConfig(appDataSource);
  await seedNews(appDataSource);
  await seedProjects(appDataSource);
  console.log('Database seeded');
}
