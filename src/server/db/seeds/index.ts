import appDataSource from '..';
import { seedAdmin } from './admin.seed';

export async function runSeed() {
  await appDataSource.initialize();
  await seedAdmin(appDataSource);
  console.log('Database seeded');
}
