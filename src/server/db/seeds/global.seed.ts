import { DataSource } from 'typeorm';
import { GlobalConfig } from '../entity/global-config';
import { Logo } from '../entity/logo';

export async function seedGlobalConfig(ds: DataSource) {
  const repo = ds.getRepository(GlobalConfig);
  const logoRepo = ds.getRepository(Logo);

  const exists = await repo.findOne({});
  if (exists) return;

  const logo = logoRepo.create({
    path: '/static/logo.png',
  });
  await logoRepo.save(logo);

  const home = repo.create({
    title: 'SDUT ACM',
    slogan: 'We love programming',
    logo,
  });

  await repo.save(home);
}
