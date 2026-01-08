import { InjectCtx, RequestContext, Post, Contract, Data } from 'bwcx-ljsm';
import { ApiController } from '@server/decorators';
import { Inject } from 'bwcx-core';
import { Api } from 'bwcx-api';
import {
  CreateProjectReqDTO,
  UpdateProjectReqDTO,
  DeleteProjectReqDTO,
  GetProjectDetailResDTO,
  GetProjectListResDTO,
  GetProjectReqDTO,
} from '@common/modules/project/project.dto';
import ProjectService from './project.service';

@ApiController()
export default class ProjectController {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
    @Inject()
    private readonly projectService: ProjectService,
  ) {}

  /** routes */
  @Api.Summary('创建项目')
  @Post('/createProject')
  @Contract(CreateProjectReqDTO, null)
  public async createProject(@Data() data: CreateProjectReqDTO): Promise<void> {
    await this.projectService.createProject(data);
  }

  @Api.Summary('更新项目')
  @Post('/updateProject')
  @Contract(UpdateProjectReqDTO, null)
  public async updateProject(@Data() data: UpdateProjectReqDTO): Promise<void> {
    await this.projectService.updateProject(data);
  }

  @Api.Summary('删除项目')
  @Post('/deleteProject')
  @Contract(DeleteProjectReqDTO, null)
  public async deleteProject(@Data() data: DeleteProjectReqDTO): Promise<void> {
    await this.projectService.deleteProject(data);
  }

  @Api.Summary('获取项目详情')
  @Post('/getProject')
  @Contract(GetProjectReqDTO, GetProjectDetailResDTO)
  public async getProject(@Data() data: GetProjectReqDTO): Promise<GetProjectDetailResDTO> {
    return await this.projectService.getProject(data);
  }

  @Api.Summary('获取所有项目列表')
  @Post('/getAllProjects')
  @Contract(null, GetProjectListResDTO)
  public async getAllProjects(): Promise<GetProjectListResDTO> {
    return await this.projectService.getAllProjects();
  }
}
