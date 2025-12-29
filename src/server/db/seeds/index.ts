import appDataSource from '..';
import { seedGlobalConfig } from './global.seed';
import { seedNews } from './news.seed';

(async () => {
  await appDataSource.initialize();

  await seedGlobalConfig(appDataSource);
  await seedNews(appDataSource);

  console.log('Database seeded');
  process.exit(0);
})();
