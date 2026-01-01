import { DataSource } from 'typeorm';
import { Project } from '../entity/project';

export async function seedProjects(ds: DataSource) {
  const repo = ds.getRepository(Project);

  const count = await repo.count();
  if (count > 0) return;

  await repo.save([
    repo.create({
      name: "SDUT OJ",
      description: "山东理工大学在线评测系统，支持多种编程语言和题型。",
    }),
    repo.create({
      name: "RankLand",
      description: "一个用于编程竞赛的在线排名系统，支持实时排名和数据分析。",
    }),
    repo.create({
      name: "光之魔法书",
      description: "一个集合了各种编程资源和教程的网站，旨在帮助初学者入门编程。",
    }),
  ]);
}
