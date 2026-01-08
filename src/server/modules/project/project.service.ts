import { Service, InjectCtx, RequestContext } from 'bwcx-ljsm';
import {
  CreateProjectReqDTO,
  UpdateProjectReqDTO,
  DeleteProjectReqDTO,
  GetProjectDetailResDTO,
  GetProjectListResDTO,
  GetProjectReqDTO,
} from '@common/modules/project/project.dto';
import appDataSource from '@server/db';
import { Project } from '@server/db/entity/project';

@Service()
export default class ProjectService {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
  ) {}

  // 创建项目
  public async createProject(data: CreateProjectReqDTO): Promise<void> {
    const projectRepo = appDataSource.getRepository(Project);
    const project = projectRepo.create({
      name: data.name,
      description: data.description,
      repoUrl: data.repoUrl,
      websiteUrl: data.websiteUrl,
      coverImage: data.coverImage,
      isFeatured: data.isFeatured || false,
    });

    await projectRepo.save(project);
  }

  // 更新项目
  public async updateProject(data: UpdateProjectReqDTO): Promise<void> {
    const projectRepo = appDataSource.getRepository(Project);
    const project = await projectRepo.findOne({ where: { id: data.id } });
    if (!project) {
      throw new Error('项目不存在');
    }

    if (data.name !== undefined) project.name = data.name;
    if (data.description !== undefined) project.description = data.description;
    if (data.repoUrl !== undefined) project.repoUrl = data.repoUrl;
    if (data.websiteUrl !== undefined) project.websiteUrl = data.websiteUrl;
    if (data.coverImage !== undefined) project.coverImage = data.coverImage;
    if (data.isFeatured !== undefined) project.isFeatured = data.isFeatured;

    await projectRepo.save(project);
  }

  // 删除项目
  public async deleteProject(data: DeleteProjectReqDTO): Promise<void> {
    const projectRepo = appDataSource.getRepository(Project);
    const project = await projectRepo.findOne({ where: { id: data.id } });
    if (!project) {
      throw new Error('项目不存在');
    }

    await projectRepo.remove(project);
  }

  // 获取项目详情
  public async getProject(data: GetProjectReqDTO): Promise<GetProjectDetailResDTO> {
    const projectRepo = appDataSource.getRepository(Project);
    const project = await projectRepo.findOne({ where: { id: data.id } });
    if (!project) {
      throw new Error('项目不存在');
    }

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      repoUrl: project.repoUrl,
      websiteUrl: project.websiteUrl,
      coverImage: project.coverImage,
      isFeatured: project.isFeatured,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  // 获取所有项目列表
  public async getAllProjects(): Promise<GetProjectListResDTO> {
    const projectRepo = appDataSource.getRepository(Project);
    const projectList = await projectRepo.find({
      order: { createdAt: 'DESC' },
    });

    return {
      rows: projectList.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        repoUrl: project.repoUrl,
        websiteUrl: project.websiteUrl,
        coverImage: project.coverImage,
        isFeatured: project.isFeatured,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      })),
    };
  }
}
