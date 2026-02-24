import { Data, Controller, InjectCtx, RequestContext, Post, Contract, UseGuards } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import { Api } from 'bwcx-api';
import { ApiController } from '@server/decorators';
import AuditService from './audit.service';
import LoginGuard from '@server/guards/login';
import {
  GetAuditLogsReqDTO,
  GetAuditLogsResDTO,
  GetAuditLogDetailReqDTO,
  GetAuditLogDetailResDTO,
  GetVersionHistoryReqDTO,
  GetVersionHistoryResDTO,
  GetVersionDetailReqDTO,
  GetVersionDetailResDTO,
  CompareVersionsReqDTO,
  CompareVersionsResDTO,
  RestoreVersionReqDTO,
  RestoreVersionResDTO,
  GetAuditStatsReqDTO,
  GetAuditStatsResDTO,
} from '@common/modules/audit/audit.dto';

@ApiController()
export default class AuditController {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
    @Inject()
    private readonly auditService: AuditService,
  ) {}

  // ============ 审计日志接口 ============

  @Api.Summary('获取审计日志列表')
  @Post('/getAuditLogs')
  @Contract(GetAuditLogsReqDTO, GetAuditLogsResDTO)
  @UseGuards(LoginGuard)
  public async getAuditLogs(@Data() data: GetAuditLogsReqDTO): Promise<GetAuditLogsResDTO> {
    return await this.auditService.getAuditLogs(data);
  }

  @Api.Summary('获取单条审计日志详情')
  @Post('/getAuditLogDetail')
  @Contract(GetAuditLogDetailReqDTO, GetAuditLogDetailResDTO)
  @UseGuards(LoginGuard)
  public async getAuditLogDetail(@Data() data: GetAuditLogDetailReqDTO): Promise<GetAuditLogDetailResDTO> {
    return await this.auditService.getAuditLogDetail(data);
  }

  // ============ 版本管理接口 ============

  @Api.Summary('获取实体版本历史')
  @Post('/getVersionHistory')
  @Contract(GetVersionHistoryReqDTO, GetVersionHistoryResDTO)
  @UseGuards(LoginGuard)
  public async getVersionHistory(@Data() data: GetVersionHistoryReqDTO): Promise<GetVersionHistoryResDTO> {
    return await this.auditService.getVersionHistory(data);
  }

  @Api.Summary('获取特定版本详情')
  @Post('/getVersionDetail')
  @Contract(GetVersionDetailReqDTO, GetVersionDetailResDTO)
  @UseGuards(LoginGuard)
  public async getVersionDetail(@Data() data: GetVersionDetailReqDTO): Promise<GetVersionDetailResDTO> {
    return await this.auditService.getVersionDetail(data);
  }

  @Api.Summary('比较两个版本')
  @Post('/compareVersions')
  @Contract(CompareVersionsReqDTO, CompareVersionsResDTO)
  @UseGuards(LoginGuard)
  public async compareVersions(@Data() data: CompareVersionsReqDTO): Promise<CompareVersionsResDTO> {
    return await this.auditService.compareVersions(data);
  }

  @Api.Summary('恢复到指定版本')
  @Post('/restoreVersion')
  @Contract(RestoreVersionReqDTO, RestoreVersionResDTO)
  @UseGuards(LoginGuard)
  public async restoreVersion(@Data() data: RestoreVersionReqDTO): Promise<RestoreVersionResDTO> {
    return await this.auditService.restoreVersion(data);
  }

  // ============ 统计接口 ============

  @Api.Summary('获取审计统计信息')
  @Post('/getAuditStats')
  @Contract(GetAuditStatsReqDTO, GetAuditStatsResDTO)
  @UseGuards(LoginGuard)
  public async getAuditStats(@Data() data: GetAuditStatsReqDTO): Promise<GetAuditStatsResDTO> {
    return await this.auditService.getAuditStats(data);
  }
}
