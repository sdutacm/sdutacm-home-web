import { FromBody } from 'bwcx-common';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum, IsDateString } from 'class-validator';

/**
 * 操作类型枚举
 */
export enum AuditActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  RESTORE = 'RESTORE',
}

/**
 * 审计日志项 VO
 */
export interface AuditLogItemVO {
  id: number;
  actionType: AuditActionType;
  entityType: string;
  entityId?: number;
  entityName?: string;
  description?: string;
  oldData?: any;
  newData?: any;
  adminId: number;
  adminUsername?: string;
  adminAvatar?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

/**
 * 数据版本项 VO
 */
export interface DataVersionItemVO {
  id: number;
  entityType: string;
  entityId: number;
  version: number;
  snapshotData: any;
  changeSummary?: string;
  adminId: number;
  adminUsername?: string;
  isCurrent: boolean;
  isDeleted: boolean;
  createdAt: Date;
}

// ============ 审计日志相关 DTO ============

/**
 * 获取审计日志列表请求
 */
export class GetAuditLogsReqDTO {
  @FromBody()
  @IsOptional()
  @IsNumber()
  page?: number;

  @FromBody()
  @IsOptional()
  @IsNumber()
  pageSize?: number;

  @FromBody()
  @IsOptional()
  @IsEnum(AuditActionType)
  actionType?: AuditActionType;

  @FromBody()
  @IsOptional()
  @IsString()
  entityType?: string;

  @FromBody()
  @IsOptional()
  @IsNumber()
  entityId?: number;

  @FromBody()
  @IsOptional()
  @IsNumber()
  adminId?: number;

  @FromBody()
  @IsOptional()
  @IsString()
  startDate?: string;

  @FromBody()
  @IsOptional()
  @IsString()
  endDate?: string;

  @FromBody()
  @IsOptional()
  @IsString()
  keyword?: string;
}

/**
 * 获取审计日志列表响应
 */
export class GetAuditLogsResDTO {
  rows: AuditLogItemVO[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * 获取单条审计日志详情请求
 */
export class GetAuditLogDetailReqDTO {
  @FromBody()
  @IsNotEmpty()
  @IsNumber()
  id: number;
}

/**
 * 获取单条审计日志详情响应
 */
export class GetAuditLogDetailResDTO {
  log: AuditLogItemVO;
}

// ============ 数据版本相关 DTO ============

/**
 * 获取实体版本历史请求
 */
export class GetVersionHistoryReqDTO {
  @FromBody()
  @IsNotEmpty()
  @IsString()
  entityType: string;

  @FromBody()
  @IsNotEmpty()
  @IsNumber()
  entityId: number;

  @FromBody()
  @IsOptional()
  @IsNumber()
  page?: number;

  @FromBody()
  @IsOptional()
  @IsNumber()
  pageSize?: number;
}

/**
 * 获取实体版本历史响应
 */
export class GetVersionHistoryResDTO {
  rows: DataVersionItemVO[];
  total: number;
  page: number;
  pageSize: number;
  currentVersion?: number;
}

/**
 * 获取特定版本详情请求
 */
export class GetVersionDetailReqDTO {
  @FromBody()
  @IsNotEmpty()
  @IsNumber()
  id: number;
}

/**
 * 获取特定版本详情响应
 */
export class GetVersionDetailResDTO {
  version: DataVersionItemVO;
}

/**
 * 比较两个版本请求
 */
export class CompareVersionsReqDTO {
  @FromBody()
  @IsNotEmpty()
  @IsNumber()
  versionId1: number;

  @FromBody()
  @IsNotEmpty()
  @IsNumber()
  versionId2: number;
}

/**
 * 比较两个版本响应
 */
export class CompareVersionsResDTO {
  version1: DataVersionItemVO;
  version2: DataVersionItemVO;
  diff: any; // 差异对象
}

/**
 * 恢复到指定版本请求
 */
export class RestoreVersionReqDTO {
  @FromBody()
  @IsNotEmpty()
  @IsNumber()
  versionId: number;
}

/**
 * 恢复到指定版本响应
 */
export class RestoreVersionResDTO {
  success: boolean;
  message: string;
  newVersionId?: number;
}

// ============ 统计相关 DTO ============

/**
 * 获取审计统计请求
 */
export class GetAuditStatsReqDTO {
  @FromBody()
  @IsOptional()
  @IsString()
  startDate?: string;

  @FromBody()
  @IsOptional()
  @IsString()
  endDate?: string;
}

/**
 * 获取审计统计响应
 */
export class GetAuditStatsResDTO {
  totalLogs: number;
  actionTypeCounts: Record<string, number>;
  entityTypeCounts: Record<string, number>;
  topAdmins: Array<{ adminId: number; username: string; count: number }>;
  recentActivity: AuditLogItemVO[];
}
