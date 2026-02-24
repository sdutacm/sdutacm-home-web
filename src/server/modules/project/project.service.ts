import { Service, InjectCtx, RequestContext } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import {
  CreateProjectReqDTO,
  UpdateProjectReqDTO,
  DeleteProjectReqDTO,
  GetProjectDetailResDTO,
  GetProjectListResDTO,
  GetProjectReqDTO,
  GetAllProjectsReqDTO,
  GetAllProjectsResDTO,
} from '@common/modules/project/project.dto';
import appDataSource from '@server/db';
import { Project } from '@server/db/entity/project';
import AuditService from '@server/modules/audit/audit.service';

@Service()
export default class ProjectService {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
    @Inject()
    private readonly auditService: AuditService,
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
      bgColor: data.bgColor || '#f4f4f4',
      isFeatured: data.isFeatured || false,
      updatedBy: this.ctx.session.admin,
    });

    const savedProject = await projectRepo.save(project);

    // 记录审计日志和创建版本
    await this.auditService.logCreate('project', savedProject.id, savedProject.name, {
      name: savedProject.name,
      description: savedProject.description,
      repoUrl: savedProject.repoUrl,
      websiteUrl: savedProject.websiteUrl,
      coverImage: savedProject.coverImage,
      bgColor: savedProject.bgColor,
      isFeatured: savedProject.isFeatured,
    });
  }

  // 更新项目
  public async updateProject(data: UpdateProjectReqDTO): Promise<void> {
    const projectRepo = appDataSource.getRepository(Project);
    const project = await projectRepo.findOne({ where: { id: data.id } });
    if (!project) {
      throw new Error('项目不存在');
    }

    // 保存旧数据用于审计
    const oldData = {
      name: project.name,
      description: project.description,
      repoUrl: project.repoUrl,
      websiteUrl: project.websiteUrl,
      coverImage: project.coverImage,
      bgColor: project.bgColor,
      isFeatured: project.isFeatured,
    };

    if (data.name !== undefined) project.name = data.name;
    if (data.description !== undefined) project.description = data.description;
    if (data.repoUrl !== undefined) project.repoUrl = data.repoUrl;
    if (data.websiteUrl !== undefined) project.websiteUrl = data.websiteUrl;
    if (data.coverImage !== undefined) project.coverImage = data.coverImage;
    if (data.bgColor !== undefined) project.bgColor = data.bgColor;
    if (data.isFeatured !== undefined) project.isFeatured = data.isFeatured;

    project.updatedBy = this.ctx.session.admin;

    await projectRepo.save(project);

    // 记录审计日志和创建新版本
    const newData = {
      name: project.name,
      description: project.description,
      repoUrl: project.repoUrl,
      websiteUrl: project.websiteUrl,
      coverImage: project.coverImage,
      bgColor: project.bgColor,
      isFeatured: project.isFeatured,
    };
    await this.auditService.logUpdate('project', project.id, project.name, oldData, newData);
  }

  // 删除项目
  public async deleteProject(data: DeleteProjectReqDTO): Promise<void> {
    const projectRepo = appDataSource.getRepository(Project);
    const project = await projectRepo.findOne({ where: { id: data.id } });
    if (!project) {
      throw new Error('项目不存在');
    }

    // 保存删除前的数据用于审计
    const oldData = {
      name: project.name,
      description: project.description,
      repoUrl: project.repoUrl,
      websiteUrl: project.websiteUrl,
      coverImage: project.coverImage,
      bgColor: project.bgColor,
      isFeatured: project.isFeatured,
    };

    // 记录删除日志并标记版本为已删除
    await this.auditService.logDelete('project', project.id, project.name, oldData);

    await projectRepo.remove(project);
  }

  // 获取项目详情
  public async getProject(data: GetProjectReqDTO): Promise<GetProjectDetailResDTO> {
    const projectRepo = appDataSource.getRepository(Project);
    const project = await projectRepo.findOne({
      where: { id: data.id },
      relations: ['updatedBy'],
    });
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
      bgColor: project.bgColor,
      isFeatured: project.isFeatured,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      updatedBy: project.updatedBy
        ? {
            id: project.updatedBy.id,
            username: project.updatedBy.username,
            avatar: project.updatedBy.avatar,
          }
        : undefined,
    };
  }

  // 获取所有项目列表（管理员用，支持分页）
  public async getAllProjects(data?: GetAllProjectsReqDTO): Promise<GetAllProjectsResDTO> {
    const projectRepo = appDataSource.getRepository(Project);
    const page = data?.page || 1;
    const pageSize = data?.pageSize || 35;
    const skip = (page - 1) * pageSize;

    const [projectList, total] = await projectRepo.findAndCount({
      relations: ['updatedBy'],
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
    });

    return {
      rows: projectList.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        repoUrl: project.repoUrl,
        websiteUrl: project.websiteUrl,
        coverImage: project.coverImage,
        bgColor: project.bgColor,
        isFeatured: project.isFeatured,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        updatedBy: project.updatedBy
          ? {
              id: project.updatedBy.id,
              username: project.updatedBy.username,
              avatar: project.updatedBy.avatar,
            }
          : undefined,
      })),
      total,
      page,
      pageSize,
      hasMore: skip + projectList.length < total,
    };
  }
}
