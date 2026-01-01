import { DataSource } from 'typeorm';
import { GlobalConfig } from '../entity/global-config';
import { Logo } from '../entity/logo';

export async function seedGlobalConfig(ds: DataSource) {
  const repo = ds.getRepository(GlobalConfig);
  const logoRepo = ds.getRepository(Logo);

  const exists = await repo.findOneBy({});
  if (exists) return;

  const logo = logoRepo.create({
    path: 'sdutacm_logo_colorful.svg',
  });
  await logoRepo.save(logo);

  const home = repo.create({
    title: '山东理工大学ACM',
    slogan: 'NO EFFORT GOES IN VAIN',
    description: `山东理工大学 ACM 实验室，包含 ACM 集训队、光锥实验室（原运维技术中心）以及 ACM 协会（社团）。

自 2008 年成立，我们一直专注于编程竞赛体系的完善，培养拥有计算机专业素养的优秀人才。

我们拥有自研的在线评测平台和榜单系统，以及全面的训练计划和培养方案，并提供更多的竞赛机遇和更大的发展平台。

我们秉持“宁拙毋巧，功不唐捐”的培养理念，与各位同仁共同推动算法竞赛的发展。`,
    logo,
  });

  await repo.save(home);
}
