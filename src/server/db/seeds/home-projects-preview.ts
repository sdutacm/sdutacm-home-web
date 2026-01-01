import { DataSource } from 'typeorm';
import { HomeProjectsPreview } from '../entity/home-projects-preview';
import { Project } from '../entity/project';

export async function seedHomeProjectsPreview(ds: DataSource) {
  const previewRepo = ds.getRepository(HomeProjectsPreview);
  const projectRepo = ds.getRepository(Project);

  if ((await previewRepo.count()) > 0) return;

  const projects = await projectRepo.find({
    order: { createdAt: 'DESC' },
    take: 3,
  });

  await previewRepo.save(
    projects.map((project, index) =>
      previewRepo.create({
        project,
        coverImage:  null,
      }),
    ),
  );
}
