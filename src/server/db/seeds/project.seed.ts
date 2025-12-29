import { DataSource } from 'typeorm';
import { Project } from '../entity/project';

export async function seedProjects(ds: DataSource) {
  const repo = ds.getRepository(Project);

  const count = await repo.count();
  if (count > 0) return;

  await repo.save([
    repo.create({
      
    })
  ]);
}
