# 审计日志与版本控制系统技术文档

## 概述

本系统为管理后台实现了完整的操作审计日志和数据版本控制功能，支持：
- 记录所有管理员操作（创建、更新、删除、登录、登出等）
- 存储数据的完整历史版本
- 支持版本对比和数据回滚

---

## 数据库设计

### 1. 审计日志表 (AuditLog)

**文件位置**: `src/server/db/entity/audit-log.ts`

```typescript
// 操作类型枚举
export enum AuditActionType {
  CREATE = 'CREATE',   // 创建
  UPDATE = 'UPDATE',   // 更新
  DELETE = 'DELETE',   // 删除
  LOGIN = 'LOGIN',     // 登录
  LOGOUT = 'LOGOUT',   // 登出
  RESTORE = 'RESTORE', // 恢复
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 主键 |
| actionType | enum | 操作类型 |
| entityType | varchar | 实体类型（news/project/media/admin/globalConfig） |
| entityId | int | 实体 ID（可空） |
| entityName | varchar | 实体名称（用于显示） |
| description | varchar | 操作描述 |
| oldData | text | 变更前数据（JSON） |
| newData | text | 变更后数据（JSON） |
| adminId | int | 操作管理员 ID |
| ipAddress | varchar | IP 地址 |
| userAgent | varchar | 浏览器 User-Agent |
| createdAt | datetime | 创建时间 |

**索引设计**:
- `idx_audit_entity`: (entityType, entityId) - 按实体查询
- `idx_audit_admin`: (adminId) - 按管理员查询
- `idx_audit_action`: (actionType) - 按操作类型查询
- `idx_audit_time`: (createdAt) - 按时间查询

### 2. 数据版本表 (DataVersion)

**文件位置**: `src/server/db/entity/data-version.ts`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 主键 |
| entityType | varchar | 实体类型 |
| entityId | int | 实体 ID |
| version | int | 版本号（递增） |
| snapshotData | text | 完整数据快照（JSON） |
| changeSummary | varchar | 变更摘要 |
| adminId | int | 操作管理员 ID |
| isCurrent | boolean | 是否为当前版本 |
| isDeleted | boolean | 实体是否已删除 |
| createdAt | datetime | 创建时间 |

**索引设计**:
- `idx_version_entity`: (entityType, entityId) - 按实体查询
- `idx_version_current`: (entityType, entityId, isCurrent) - 查询当前版本

---

## 服务层设计

### AuditService

**文件位置**: `src/server/modules/audit/audit.service.ts`

#### 核心方法

```typescript
// 1. 基础日志记录（仅记录日志，不创建版本）
async logAction(params: {
  actionType: AuditActionType;
  entityType: string;
  entityId?: number;
  entityName?: string;
  description?: string;
  oldData?: any;
  newData?: any;
}): Promise<AuditLog>

// 2. 创建操作（记录日志 + 创建初始版本）
async logCreate(
  entityType: string,
  entityId: number,
  entityName: string,
  data: any
): Promise<void>

// 3. 更新操作（记录日志 + 创建新版本）
async logUpdate(
  entityType: string,
  entityId: number,
  entityName: string,
  oldData: any,
  newData: any
): Promise<void>

// 4. 删除操作（记录日志 + 标记版本为已删除）
async logDelete(
  entityType: string,
  entityId: number,
  entityName: string,
  oldData: any
): Promise<void>

// 5. 登录/登出日志
async logLogin(admin: Admin): Promise<void>
async logLogout(): Promise<void>
```

#### 版本管理方法

```typescript
// 创建新版本
private async createVersion(
  entityType: string,
  entityId: number,
  snapshotData: any,
  changeSummary: string
): Promise<DataVersion>

// 恢复到指定版本
async restoreVersion(dto: RestoreVersionReqDTO): Promise<RestoreVersionResDTO>

// 比较两个版本
async compareVersions(dto: CompareVersionsReqDTO): Promise<CompareVersionsResDTO>
```

---

## 使用方式

### 在业务 Service 中集成审计

以 NewsService 为例：

```typescript
import AuditService from '@server/modules/audit/audit.service';

@Service()
export default class NewsService {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
    @Inject()
    private readonly auditService: AuditService,  // 注入审计服务
  ) {}

  // 创建新闻
  async createNews(data: CreateNewsReqDTO): Promise<void> {
    const newsRepo = appDataSource.getRepository(News);
    const news = newsRepo.create({ ... });
    const savedNews = await newsRepo.save(news);

    // 记录创建日志和初始版本
    await this.auditService.logCreate('news', savedNews.id, savedNews.title, {
      title: savedNews.title,
      summary: savedNews.summary,
      content: savedNews.content,
      // ... 其他字段
    });
  }

  // 更新新闻
  async updateNews(data: UpdateNewsReqDTO): Promise<void> {
    const news = await newsRepo.findOne({ where: { id: data.id } });
    
    // 保存旧数据
    const oldData = {
      title: news.title,
      summary: news.summary,
      content: news.content,
    };

    // 执行更新
    news.title = data.title;
    await newsRepo.save(news);

    // 记录更新日志和新版本
    const newData = { title: news.title, ... };
    await this.auditService.logUpdate('news', news.id, news.title, oldData, newData);
  }

  // 删除新闻
  async deleteNews(data: DeleteNewsReqDTO): Promise<void> {
    const news = await newsRepo.findOne({ where: { id: data.id } });
    
    const oldData = { ... };  // 保存删除前数据
    
    // 记录删除日志（标记版本为已删除）
    await this.auditService.logDelete('news', news.id, news.title, oldData);
    
    await newsRepo.remove(news);
  }
}
```

### 仅记录日志（不需要版本控制的场景）

对于敏感操作（如密码重置），仅记录审计日志而不存储版本：

```typescript
// 密码重置（敏感操作，不存储版本）
await this.auditService.logAction({
  actionType: AuditActionType.UPDATE,
  entityType: 'admin',
  entityId: admin.id,
  entityName: admin.username,
  description: `重置管理员密码: ${admin.username}`,
  // 不记录 oldData/newData 避免密码泄露
});
```

### 支持版本控制的实体类型

| 实体类型 | 说明 | 版本控制 |
|---------|------|---------|
| news | 新闻 | ✅ |
| project | 项目 | ✅ |
| media | 媒体文件 | ✅ |
| admin | 管理员 | ✅ |
| globalConfig | 全局配置 | ✅ |

---

## API 接口

### 审计日志接口

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/getAuditLogs | POST | 获取审计日志列表（分页、筛选） |
| /api/getAuditLogDetail | POST | 获取单条日志详情 |
| /api/getAuditStats | POST | 获取审计统计信息 |

### 版本管理接口

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/getVersionHistory | POST | 获取实体的版本历史 |
| /api/getVersionDetail | POST | 获取特定版本详情 |
| /api/compareVersions | POST | 比较两个版本的差异 |
| /api/restoreVersion | POST | 恢复到指定版本 |

---

## DTO 定义

**文件位置**: `src/common/modules/audit/audit.dto.ts`

### 请求 DTO

```typescript
// 获取审计日志请求
class GetAuditLogsReqDTO {
  page?: number;
  pageSize?: number;
  actionType?: AuditActionType;  // 筛选操作类型
  entityType?: string;           // 筛选实体类型
  entityId?: number;             // 筛选实体 ID
  adminId?: number;              // 筛选管理员
  startDate?: string;            // 时间范围开始
  endDate?: string;              // 时间范围结束
}

// 获取版本历史请求
class GetVersionHistoryReqDTO {
  entityType: string;  // 必填
  entityId: number;    // 必填
  page?: number;
  pageSize?: number;
}

// 恢复版本请求
class RestoreVersionReqDTO {
  versionId: number;   // 目标版本 ID
}
```

### 响应 VO

```typescript
// 审计日志项
interface AuditLogItemVO {
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

// 数据版本项
interface DataVersionItemVO {
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
```

---

## 前端页面

**文件位置**: `src/client/modules/admin/audit-log.view.vue`

### 功能模块

1. **统计卡片**: 显示总操作数、创建/更新/删除操作数
2. **筛选区域**: 支持按操作类型、实体类型、时间范围筛选
3. **日志列表**: 表格展示所有审计日志
4. **详情弹窗**: 查看单条日志的完整信息和数据变更
5. **版本历史弹窗**: 时间线展示实体的所有版本
6. **版本对比弹窗**: 以 diff 形式展示两个版本的差异
7. **一键恢复**: 将数据恢复到指定历史版本

---

## 版本恢复流程

```
1. 用户点击"恢复"按钮
   ↓
2. 前端调用 restoreVersion API
   ↓
3. 后端从 DataVersion 表读取目标版本的 snapshotData
   ↓
4. 根据 entityType 找到对应的 Repository
   ↓
5. 如果实体已删除 → 重新创建实体
   否则 → 更新现有实体
   ↓
6. 记录 RESTORE 类型的审计日志
   ↓
7. 创建新的版本记录（恢复操作也会产生新版本）
   ↓
8. 返回成功响应
```

---

## 已接入的模块

| 模块 | 审计日志 | 版本控制 | 说明 |
|------|:--------:|:--------:|------|
| News | ✅ | ✅ | 创建/更新/删除 |
| Project | ✅ | ✅ | 创建/更新/删除 |
| Media | ✅ | ✅ | 上传/更新/删除 |
| Admin | ✅ | ❌ | 注册/登录/登出/角色变更/密码重置/删除（敏感数据不存版本） |
| GlobalConfig | ✅ | ❌ | 更新（仅记录日志） |

---

## 注意事项

1. **敏感数据**: 管理员密码等敏感信息不应存入审计日志的 oldData/newData
2. **数据量**: 长期运行会产生大量日志，建议定期归档或清理
3. **性能**: 恢复操作涉及数据库写入，建议添加操作确认
4. **权限**: 所有审计接口都需要管理员登录（使用 LoginGuard）

---

## 扩展建议

1. **日志导出**: 支持导出审计日志为 Excel/CSV
2. **告警机制**: 对异常操作（如批量删除）发送告警
3. **日志归档**: 定期将历史日志归档到冷存储
4. **权限分级**: 只有超级管理员才能查看完整审计日志
