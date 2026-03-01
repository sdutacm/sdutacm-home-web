import { Service, InjectCtx, RequestContext } from 'bwcx-ljsm';
import appDataSource from '@server/db';
import { AuditLog, AuditActionType } from '@server/db/entity/audit-log';
import { DataVersion } from '@server/db/entity/data-version';
import { Admin } from '@server/db/entity/admin';
import { News } from '@server/db/entity/news';
import { NewsCategory } from '@server/db/entity/news-category';
import { Project } from '@server/db/entity/project';
import { Media } from '@server/db/entity/media';
import { GlobalConfig } from '@server/db/entity/global-config';
import {
  GetAuditLogsReqDTO,
  GetAuditLogsResDTO,
  AuditLogItemVO,
  GetAuditLogDetailReqDTO,
  GetAuditLogDetailResDTO,
  GetVersionHistoryReqDTO,
  GetVersionHistoryResDTO,
  DataVersionItemVO,
  GetVersionDetailReqDTO,
  GetVersionDetailResDTO,
  CompareVersionsReqDTO,
  CompareVersionsResDTO,
  RestoreVersionReqDTO,
  RestoreVersionResDTO,
  GetAuditStatsReqDTO,
  GetAuditStatsResDTO,
} from '@common/modules/audit/audit.dto';
import { Between, Like, In } from 'typeorm';

// 支持版本控制的实体类型映射
const ENTITY_REPOSITORY_MAP: Record<string, any> = {
  news: News,
  news_category: NewsCategory,
  project: Project,
  media: Media,
  admin: Admin,
  globalConfig: GlobalConfig,
};

@Service()
export default class AuditService {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
  ) {}

  // ============ 审计日志记录方法 ============

  /**
   * 记录审计日志
   */
  public async logAction(params: {
    actionType: AuditActionType;
    entityType: string;
    entityId?: number;
    entityName?: string;
    description?: string;
    oldData?: any;
    newData?: any;
  }): Promise<AuditLog> {
    const auditLogRepo = appDataSource.getRepository(AuditLog);

    // 获取当前管理员信息
    const admin = this.ctx.session?.admin;
    const req = this.ctx.req;

    const log = auditLogRepo.create({
      actionType: params.actionType,
      entityType: params.entityType,
      entityId: params.entityId,
      entityName: params.entityName,
      description: params.description,
      oldData: params.oldData ? JSON.stringify(params.oldData) : null,
      newData: params.newData ? JSON.stringify(params.newData) : null,
      adminId: admin?.id,
      ipAddress: req?.headers['x-forwarded-for'] as string || req?.socket?.remoteAddress || '',
      userAgent: req?.headers['user-agent'] || '',
    });

    return await auditLogRepo.save(log);
  }

  /**
   * 记录登录日志
   */
  public async logLogin(admin: Admin): Promise<void> {
    await this.logAction({
      actionType: AuditActionType.LOGIN,
      entityType: 'admin',
      entityId: admin.id,
      entityName: admin.username,
      description: `管理员 ${admin.username} 登录系统`,
    });
  }

  /**
   * 记录登出日志
   */
  public async logLogout(): Promise<void> {
    const admin = this.ctx.session?.admin;
    if (admin) {
      await this.logAction({
        actionType: AuditActionType.LOGOUT,
        entityType: 'admin',
        entityId: admin.id,
        entityName: admin.username,
        description: `管理员 ${admin.username} 退出系统`,
      });
    }
  }

  /**
   * 记录创建操作并保存初始版本
   */
  public async logCreate(
    entityType: string,
    entityId: number,
    entityName: string,
    data: any,
  ): Promise<void> {
    await this.logAction({
      actionType: AuditActionType.CREATE,
      entityType,
      entityId,
      entityName,
      description: `创建${this.getEntityTypeName(entityType)}: ${entityName}`,
      newData: data,
    });

    // 创建初始版本
    await this.createVersion(entityType, entityId, data, `初始创建`);
  }

  /**
   * 记录更新操作并保存新版本
   */
  public async logUpdate(
    entityType: string,
    entityId: number,
    entityName: string,
    oldData: any,
    newData: any,
  ): Promise<void> {
    await this.logAction({
      actionType: AuditActionType.UPDATE,
      entityType,
      entityId,
      entityName,
      description: `更新${this.getEntityTypeName(entityType)}: ${entityName}`,
      oldData,
      newData,
    });

    // 创建新版本
    const changeSummary = this.generateChangeSummary(oldData, newData);
    await this.createVersion(entityType, entityId, newData, changeSummary);
  }

  /**
   * 记录删除操作并标记版本为已删除
   */
  public async logDelete(
    entityType: string,
    entityId: number,
    entityName: string,
    oldData: any,
  ): Promise<void> {
    await this.logAction({
      actionType: AuditActionType.DELETE,
      entityType,
      entityId,
      entityName,
      description: `删除${this.getEntityTypeName(entityType)}: ${entityName}`,
      oldData,
    });

    // 标记所有版本为已删除
    await this.markVersionsDeleted(entityType, entityId);
  }

  // ============ 版本管理方法 ============

  /**
   * 创建数据版本
   */
  private async createVersion(
    entityType: string,
    entityId: number,
    snapshotData: any,
    changeSummary: string,
  ): Promise<DataVersion> {
    const versionRepo = appDataSource.getRepository(DataVersion);
    const admin = this.ctx.session?.admin;

    // 获取当前最大版本号
    const lastVersion = await versionRepo.findOne({
      where: { entityType, entityId },
      order: { version: 'DESC' },
    });

    const newVersionNum = (lastVersion?.version || 0) + 1;

    // 将所有旧版本的 isCurrent 设为 false
    await versionRepo.update(
      { entityType, entityId, isCurrent: true },
      { isCurrent: false },
    );

    // 创建新版本
    const version = versionRepo.create({
      entityType,
      entityId,
      version: newVersionNum,
      snapshotData: JSON.stringify(snapshotData),
      changeSummary,
      adminId: admin?.id,
      isCurrent: true,
      isDeleted: false,
    });

    return await versionRepo.save(version);
  }

  /**
   * 标记版本为已删除
   */
  private async markVersionsDeleted(
    entityType: string,
    entityId: number,
  ): Promise<void> {
    const versionRepo = appDataSource.getRepository(DataVersion);
    await versionRepo.update(
      { entityType, entityId },
      { isDeleted: true, isCurrent: false },
    );
  }

  // ============ 查询方法 ============

  /**
   * 获取审计日志列表
   */
  public async getAuditLogs(dto: GetAuditLogsReqDTO): Promise<GetAuditLogsResDTO> {
    const auditLogRepo = appDataSource.getRepository(AuditLog);
    const adminRepo = appDataSource.getRepository(Admin);

    const page = dto.page || 1;
    const pageSize = dto.pageSize || 20;

    // 构建查询条件
    const where: any = {};
    if (dto.actionType) {
      where.actionType = dto.actionType;
    }
    if (dto.entityType) {
      where.entityType = dto.entityType;
    }
    if (dto.entityId) {
      where.entityId = dto.entityId;
    }
    if (dto.adminId) {
      where.adminId = dto.adminId;
    }
    if (dto.startDate && dto.endDate) {
      where.createdAt = Between(new Date(dto.startDate), new Date(dto.endDate));
    }

    const [logs, total] = await auditLogRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 获取管理员信息
    const adminIds = [...new Set(logs.map(l => l.adminId).filter(Boolean))];
    const admins = adminIds.length > 0
      ? await adminRepo.find({ where: { id: In(adminIds) } })
      : [];
    const adminMap = new Map(admins.map(a => [a.id, a]));

    const rows: AuditLogItemVO[] = logs.map(log => {
      const admin = log.adminId ? adminMap.get(log.adminId) : null;
      return {
        id: log.id,
        actionType: log.actionType,
        entityType: log.entityType,
        entityId: log.entityId,
        entityName: log.entityName,
        description: log.description,
        oldData: log.oldData ? JSON.parse(log.oldData) : null,
        newData: log.newData ? JSON.parse(log.newData) : null,
        adminId: log.adminId,
        adminUsername: admin?.username,
        adminAvatar: admin?.avatar,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
      };
    });

    return {
      rows,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  /**
   * 获取单条审计日志详情
   */
  public async getAuditLogDetail(dto: GetAuditLogDetailReqDTO): Promise<GetAuditLogDetailResDTO> {
    const auditLogRepo = appDataSource.getRepository(AuditLog);
    const adminRepo = appDataSource.getRepository(Admin);

    const log = await auditLogRepo.findOne({ where: { id: dto.id } });
    if (!log) {
      throw new Error('审计日志不存在');
    }

    let admin = null;
    if (log.adminId) {
      admin = await adminRepo.findOne({ where: { id: log.adminId } });
    }

    return {
      log: {
        id: log.id,
        actionType: log.actionType,
        entityType: log.entityType,
        entityId: log.entityId,
        entityName: log.entityName,
        description: log.description,
        oldData: log.oldData ? JSON.parse(log.oldData) : null,
        newData: log.newData ? JSON.parse(log.newData) : null,
        adminId: log.adminId,
        adminUsername: admin?.username,
        adminAvatar: admin?.avatar,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
      },
    };
  }

  /**
   * 获取实体版本历史
   */
  public async getVersionHistory(dto: GetVersionHistoryReqDTO): Promise<GetVersionHistoryResDTO> {
    const versionRepo = appDataSource.getRepository(DataVersion);
    const adminRepo = appDataSource.getRepository(Admin);

    const page = dto.page || 1;
    const pageSize = dto.pageSize || 20;

    const [versions, total] = await versionRepo.findAndCount({
      where: { entityType: dto.entityType, entityId: dto.entityId },
      order: { version: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 获取管理员信息
    const adminIds = [...new Set(versions.map(v => v.adminId).filter(Boolean))];
    const admins = adminIds.length > 0
      ? await adminRepo.find({ where: { id: In(adminIds) } })
      : [];
    const adminMap = new Map(admins.map(a => [a.id, a]));

    // 获取当前版本号
    const currentVersion = await versionRepo.findOne({
      where: { entityType: dto.entityType, entityId: dto.entityId, isCurrent: true },
    });

    const rows: DataVersionItemVO[] = versions.map(v => {
      const admin = v.adminId ? adminMap.get(v.adminId) : null;
      return {
        id: v.id,
        entityType: v.entityType,
        entityId: v.entityId,
        version: v.version,
        snapshotData: v.snapshotData ? JSON.parse(v.snapshotData) : null,
        changeSummary: v.changeSummary,
        adminId: v.adminId,
        adminUsername: admin?.username,
        isCurrent: v.isCurrent,
        isDeleted: v.isDeleted,
        createdAt: v.createdAt,
      };
    });

    return {
      rows,
      total,
      page,
      pageSize,
      currentVersion: currentVersion?.version,
    };
  }

  /**
   * 获取特定版本详情
   */
  public async getVersionDetail(dto: GetVersionDetailReqDTO): Promise<GetVersionDetailResDTO> {
    const versionRepo = appDataSource.getRepository(DataVersion);
    const adminRepo = appDataSource.getRepository(Admin);

    const version = await versionRepo.findOne({ where: { id: dto.id } });
    if (!version) {
      throw new Error('版本不存在');
    }

    let admin = null;
    if (version.adminId) {
      admin = await adminRepo.findOne({ where: { id: version.adminId } });
    }

    return {
      version: {
        id: version.id,
        entityType: version.entityType,
        entityId: version.entityId,
        version: version.version,
        snapshotData: version.snapshotData ? JSON.parse(version.snapshotData) : null,
        changeSummary: version.changeSummary,
        adminId: version.adminId,
        adminUsername: admin?.username,
        isCurrent: version.isCurrent,
        isDeleted: version.isDeleted,
        createdAt: version.createdAt,
      },
    };
  }

  /**
   * 比较两个版本
   */
  public async compareVersions(dto: CompareVersionsReqDTO): Promise<CompareVersionsResDTO> {
    const versionRepo = appDataSource.getRepository(DataVersion);
    const adminRepo = appDataSource.getRepository(Admin);

    const version1 = await versionRepo.findOne({ where: { id: dto.versionId1 } });
    const version2 = await versionRepo.findOne({ where: { id: dto.versionId2 } });

    if (!version1 || !version2) {
      throw new Error('版本不存在');
    }

    const adminIds = [version1.adminId, version2.adminId].filter(Boolean);
    const admins = adminIds.length > 0
      ? await adminRepo.find({ where: { id: In(adminIds) } })
      : [];
    const adminMap = new Map(admins.map(a => [a.id, a]));

    const data1 = version1.snapshotData ? JSON.parse(version1.snapshotData) : {};
    const data2 = version2.snapshotData ? JSON.parse(version2.snapshotData) : {};
    const diff = this.computeDiff(data1, data2);

    const toVO = (v: DataVersion): DataVersionItemVO => {
      const admin = v.adminId ? adminMap.get(v.adminId) : null;
      return {
        id: v.id,
        entityType: v.entityType,
        entityId: v.entityId,
        version: v.version,
        snapshotData: v.snapshotData ? JSON.parse(v.snapshotData) : null,
        changeSummary: v.changeSummary,
        adminId: v.adminId,
        adminUsername: admin?.username,
        isCurrent: v.isCurrent,
        isDeleted: v.isDeleted,
        createdAt: v.createdAt,
      };
    };

    return {
      version1: toVO(version1),
      version2: toVO(version2),
      diff,
    };
  }

  /**
   * 恢复到指定版本
   */
  public async restoreVersion(dto: RestoreVersionReqDTO): Promise<RestoreVersionResDTO> {
    const versionRepo = appDataSource.getRepository(DataVersion);

    const targetVersion = await versionRepo.findOne({ where: { id: dto.versionId } });
    if (!targetVersion) {
      throw new Error('目标版本不存在');
    }

    const entityType = targetVersion.entityType;
    const entityId = targetVersion.entityId;
    const snapshotData = targetVersion.snapshotData ? JSON.parse(targetVersion.snapshotData) : null;

    if (!snapshotData) {
      throw new Error('版本快照数据不完整');
    }

    // 获取实体 Repository
    const EntityClass = ENTITY_REPOSITORY_MAP[entityType];
    if (!EntityClass) {
      throw new Error(`不支持恢复的实体类型: ${entityType}`);
    }

    const entityRepo = appDataSource.getRepository(EntityClass);

    // 获取当前数据作为旧数据
    const currentEntity = await entityRepo.findOne({ where: { id: entityId } });
    const oldData = currentEntity ? { ...currentEntity } : null;

    // 过滤掉非实体属性（如关联数据的 ID 数组）
    const filteredSnapshotData = this.filterEntityProperties(entityType, snapshotData);

    // 恢复数据
    if (targetVersion.isDeleted) {
      // 如果实体已删除，需要重新创建
      const newEntity = entityRepo.create({
        ...filteredSnapshotData,
        id: entityId,
      });
      await entityRepo.save(newEntity);
    } else {
      // 更新现有实体
      await entityRepo.update(entityId, filteredSnapshotData);
    }

    // 记录恢复操作日志
    await this.logAction({
      actionType: AuditActionType.RESTORE,
      entityType,
      entityId,
      entityName: snapshotData.title || snapshotData.name || `#${entityId}`,
      description: `恢复${this.getEntityTypeName(entityType)}到版本 ${targetVersion.version}`,
      oldData,
      newData: snapshotData,
    });

    // 创建新版本（恢复也会产生新版本）
    const newVersion = await this.createVersion(
      entityType,
      entityId,
      snapshotData,
      `恢复到版本 ${targetVersion.version}`,
    );

    // 如果之前是删除状态，清除删除标记
    if (targetVersion.isDeleted) {
      await versionRepo.update(
        { entityType, entityId, isDeleted: true },
        { isDeleted: false },
      );
    }

    return {
      success: true,
      message: `成功恢复到版本 ${targetVersion.version}`,
      newVersionId: newVersion.id,
    };
  }

  /**
   * 获取审计统计信息
   */
  public async getAuditStats(dto: GetAuditStatsReqDTO): Promise<GetAuditStatsResDTO> {
    const auditLogRepo = appDataSource.getRepository(AuditLog);
    const adminRepo = appDataSource.getRepository(Admin);

    // 构建时间范围条件
    const dateCondition: any = {};
    if (dto.startDate && dto.endDate) {
      dateCondition.createdAt = Between(new Date(dto.startDate), new Date(dto.endDate));
    }

    // 总日志数
    const totalLogs = await auditLogRepo.count({ where: dateCondition });

    // 按操作类型统计
    const actionTypeCounts: Record<string, number> = {};
    for (const type of Object.values(AuditActionType)) {
      const count = await auditLogRepo.count({
        where: { ...dateCondition, actionType: type },
      });
      actionTypeCounts[type] = count;
    }

    // 按实体类型统计
    const entityTypes = ['news', 'news_category', 'project', 'media', 'admin'];
    const entityTypeCounts: Record<string, number> = {};
    for (const type of entityTypes) {
      const count = await auditLogRepo.count({
        where: { ...dateCondition, entityType: type },
      });
      entityTypeCounts[type] = count;
    }

    // 最活跃管理员
    const topAdminsRaw = await auditLogRepo
      .createQueryBuilder('log')
      .select('log.adminId', 'adminId')
      .addSelect('COUNT(*)', 'count')
      .where(dateCondition.createdAt ? 'log.createdAt BETWEEN :start AND :end' : '1=1', {
        start: dto.startDate,
        end: dto.endDate,
      })
      .groupBy('log.adminId')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    const topAdminIds = topAdminsRaw.map(r => r.adminId).filter(Boolean);
    const topAdminUsers = topAdminIds.length > 0
      ? await adminRepo.find({ where: { id: In(topAdminIds) } })
      : [];
    const topAdminMap = new Map(topAdminUsers.map(a => [a.id, a]));

    const topAdmins = topAdminsRaw
      .filter(r => r.adminId)
      .map(r => ({
        adminId: r.adminId,
        username: topAdminMap.get(r.adminId)?.username || 'Unknown',
        count: parseInt(r.count),
      }));

    // 最近活动
    const recentLogs = await auditLogRepo.find({
      where: dateCondition,
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const recentAdminIds = [...new Set(recentLogs.map(l => l.adminId).filter(Boolean))];
    const recentAdmins = recentAdminIds.length > 0
      ? await adminRepo.find({ where: { id: In(recentAdminIds) } })
      : [];
    const recentAdminMap = new Map(recentAdmins.map(a => [a.id, a]));

    const recentActivity: AuditLogItemVO[] = recentLogs.map(log => {
      const admin = log.adminId ? recentAdminMap.get(log.adminId) : null;
      return {
        id: log.id,
        actionType: log.actionType,
        entityType: log.entityType,
        entityId: log.entityId,
        entityName: log.entityName,
        description: log.description,
        oldData: log.oldData ? JSON.parse(log.oldData) : null,
        newData: log.newData ? JSON.parse(log.newData) : null,
        adminId: log.adminId,
        adminUsername: admin?.username,
        adminAvatar: admin?.avatar,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
      };
    });

    return {
      totalLogs,
      actionTypeCounts,
      entityTypeCounts,
      topAdmins,
      recentActivity,
    };
  }

  // ============ 工具方法 ============

  /**
   * 获取实体类型的中文名称
   */
  private getEntityTypeName(entityType: string): string {
    const names: Record<string, string> = {
      news: '新闻',
      news_category: '新闻栏目',
      project: '项目',
      media: '媒体文件',
      admin: '管理员',
      globalConfig: '全局配置',
    };
    return names[entityType] || entityType;
  }

  /**
   * 过滤实体属性，移除非实际数据库列的属性
   */
  private filterEntityProperties(entityType: string, data: any): any {
    // 定义每种实体类型需要排除的属性
    const excludeProperties: Record<string, string[]> = {
      globalConfig: ['homeNewsPreviewIds', 'homeProjectsPreviewIds', 'createdAt', 'updatedAt'],
      news: ['createdAt', 'updatedAt'],
      news_category: ['createdAt', 'updatedAt'],
      project: ['createdAt', 'updatedAt'],
      media: ['createdAt', 'updatedAt'],
      admin: ['createdAt', 'updatedAt', 'password'],
    };

    const excludeList = excludeProperties[entityType] || [];
    const filtered: any = {};

    for (const key of Object.keys(data)) {
      if (!excludeList.includes(key)) {
        filtered[key] = data[key];
      }
    }

    return filtered;
  }

  /**
   * 生成变更摘要
   */
  private generateChangeSummary(oldData: any, newData: any): string {
    const changes: string[] = [];
    const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);

    for (const key of allKeys) {
      if (JSON.stringify(oldData?.[key]) !== JSON.stringify(newData?.[key])) {
        changes.push(key);
      }
    }

    if (changes.length === 0) {
      return '无变更';
    }

    return `修改了: ${changes.slice(0, 5).join(', ')}${changes.length > 5 ? ` 等${changes.length}项` : ''}`;
  }

  /**
   * 计算两个对象的差异
   */
  private computeDiff(obj1: any, obj2: any): any {
    const diff: any = {};
    const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

    for (const key of allKeys) {
      const val1 = obj1?.[key];
      const val2 = obj2?.[key];

      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        diff[key] = {
          old: val1,
          new: val2,
        };
      }
    }

    return diff;
  }
}
