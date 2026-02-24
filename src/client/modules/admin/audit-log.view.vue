<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Watch } from 'vue-property-decorator';
import { View, ChildOf, RenderMethod, RenderMethodKind } from 'bwcx-client-vue3';
import {
  AuditLogItemVO,
  DataVersionItemVO,
  AuditActionType,
} from '@common/modules/audit/audit.dto';

import {
  ElMessage,
  ElMessageBox,
  ElIcon,
  ElButton,
  ElTable,
  ElTableColumn,
  ElTag,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElPagination,
  ElDatePicker,
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElTimeline,
  ElTimelineItem,
  ElTabs,
  ElTabPane,
  ElTooltip,
  vLoading,
} from 'element-plus';
import { Head } from '@vueuse/head';
import {
  Eye,
  RotateCcw,
  Search,
  RefreshCw,
  History,
  Clock,
  User,
  FileText,
} from 'lucide-vue-next';
import UserAvatar from '@client/components/user-avatar.vue';

@View('/admin/audit-log')
@ChildOf('AdminView')
@RenderMethod(RenderMethodKind.CSR)
@Options({
  directives: {
    loading: vLoading,
  },
  components: {
    ElIcon,
    ElButton,
    ElTable,
    ElTableColumn,
    ElTag,
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    ElSelect,
    ElOption,
    ElPagination,
    ElDatePicker,
    ElCard,
    ElDescriptions,
    ElDescriptionsItem,
    ElEmpty,
    ElTimeline,
    ElTimelineItem,
    ElTabs,
    ElTabPane,
    ElTooltip,
    Head,
    Eye,
    RotateCcw,
    Search,
    RefreshCw,
    History,
    Clock,
    User,
    FileText,
    UserAvatar,
  },
})
export default class AuditLogContainer extends Vue {
  // 审计日志列表
  auditLogs: AuditLogItemVO[] = [];
  total = 0;
  currentPage = 1;
  pageSize = 20;
  loading = true;

  // 筛选条件
  filterForm = {
    actionType: '' as AuditActionType | '',
    entityType: '',
    adminId: null as number | null,
    dateRange: null as [Date, Date] | null,
    keyword: '',
  };

  // 详情对话框
  detailDialogVisible = false;
  currentLog: AuditLogItemVO | null = null;

  // 版本历史对话框
  versionDialogVisible = false;
  versionHistory: DataVersionItemVO[] = [];
  versionLoading = false;
  versionEntityType = '';
  versionEntityId = 0;
  versionEntityName = '';

  // 版本详情对话框
  versionDetailDialogVisible = false;
  currentVersion: DataVersionItemVO | null = null;
  compareVersion: DataVersionItemVO | null = null;
  versionDiff: any = null;
  compareMode = false;

  // 统计数据
  stats = {
    totalLogs: 0,
    actionTypeCounts: {} as Record<string, number>,
    entityTypeCounts: {} as Record<string, number>,
    topAdmins: [] as Array<{ adminId: number; username: string; count: number }>,
    recentActivity: [] as AuditLogItemVO[],
  };

  // 操作类型选项
  actionTypeOptions = [
    { value: '', label: '全部' },
    { value: AuditActionType.CREATE, label: '创建' },
    { value: AuditActionType.UPDATE, label: '更新' },
    { value: AuditActionType.DELETE, label: '删除' },
    { value: AuditActionType.LOGIN, label: '登录' },
    { value: AuditActionType.LOGOUT, label: '登出' },
    { value: AuditActionType.RESTORE, label: '恢复' },
  ];

  // 实体类型选项
  entityTypeOptions = [
    { value: '', label: '全部' },
    { value: 'news', label: '新闻' },
    { value: 'project', label: '项目' },
    { value: 'media', label: '媒体文件' },
    { value: 'admin', label: '管理员' },
    { value: 'globalConfig', label: '全局配置' },
  ];

  async mounted() {
    await this.loadAuditLogs();
    await this.loadStats();
    this.loading = false;
  }

  async loadAuditLogs() {
    try {
      const params: any = {
        page: this.currentPage,
        pageSize: this.pageSize,
      };

      if (this.filterForm.actionType) {
        params.actionType = this.filterForm.actionType;
      }
      if (this.filterForm.entityType) {
        params.entityType = this.filterForm.entityType;
      }
      if (this.filterForm.adminId) {
        params.adminId = this.filterForm.adminId;
      }
      if (this.filterForm.dateRange) {
        params.startDate = this.filterForm.dateRange[0].toISOString();
        params.endDate = this.filterForm.dateRange[1].toISOString();
      }
      if (this.filterForm.keyword) {
        params.keyword = this.filterForm.keyword;
      }

      const res = await this.$api.getAuditLogs(params);
      this.auditLogs = res.rows;
      this.total = res.total;
    } catch (error) {
      console.error('加载审计日志失败:', error);
      ElMessage.error('加载审计日志失败');
    }
  }

  async loadStats() {
    try {
      const res = await this.$api.getAuditStats({});
      this.stats = res;
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  }

  handlePageChange(page: number) {
    this.currentPage = page;
    this.loadAuditLogs();
  }

  handleSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadAuditLogs();
  }

  async handleSearch() {
    this.currentPage = 1;
    await this.loadAuditLogs();
  }

  async handleReset() {
    this.filterForm = {
      actionType: '',
      entityType: '',
      adminId: null,
      dateRange: null,
      keyword: '',
    };
    this.currentPage = 1;
    await this.loadAuditLogs();
  }

  async viewLogDetail(log: AuditLogItemVO) {
    this.currentLog = log;
    this.detailDialogVisible = true;
  }

  async viewVersionHistory(log: AuditLogItemVO) {
    if (!log.entityId || !log.entityType) {
      ElMessage.warning('该操作没有关联的实体');
      return;
    }

    this.versionEntityType = log.entityType;
    this.versionEntityId = log.entityId;
    this.versionEntityName = log.entityName || `#${log.entityId}`;
    this.versionLoading = true;
    this.versionDialogVisible = true;

    try {
      const res = await this.$api.getVersionHistory({
        entityType: log.entityType,
        entityId: log.entityId,
        page: 1,
        pageSize: 50,
      });
      this.versionHistory = res.rows;
    } catch (error) {
      console.error('加载版本历史失败:', error);
      ElMessage.error('加载版本历史失败');
    } finally {
      this.versionLoading = false;
    }
  }

  async viewVersionDetail(version: DataVersionItemVO) {
    this.currentVersion = version;
    this.compareMode = false;
    this.versionDetailDialogVisible = true;
  }

  async compareWithCurrent(version: DataVersionItemVO) {
    if (version.isCurrent) {
      ElMessage.info('这已经是当前版本');
      return;
    }

    const currentVersion = this.versionHistory.find((v) => v.isCurrent);
    if (!currentVersion) {
      ElMessage.warning('未找到当前版本');
      return;
    }

    try {
      const res = await this.$api.compareVersions({
        versionId1: version.id,
        versionId2: currentVersion.id,
      });
      this.currentVersion = res.version1;
      this.compareVersion = res.version2;
      this.versionDiff = res.diff;
      this.compareMode = true;
      this.versionDetailDialogVisible = true;
    } catch (error) {
      console.error('比较版本失败:', error);
      ElMessage.error('比较版本失败');
    }
  }

  async restoreVersion(version: DataVersionItemVO) {
    if (version.isCurrent) {
      ElMessage.info('这已经是当前版本，无需恢复');
      return;
    }

    try {
      await ElMessageBox.confirm(
        `确定要恢复 "${this.versionEntityName}" 到版本 ${version.version} 吗？这将创建一个新的版本记录。`,
        '确认恢复',
        {
          confirmButtonText: '确定恢复',
          cancelButtonText: '取消',
          type: 'warning',
        },
      );

      const res = await this.$api.restoreVersion({ versionId: version.id });

      if (res.success) {
        ElMessage.success(res.message);
        // 重新加载版本历史
        await this.viewVersionHistory({
          entityType: this.versionEntityType,
          entityId: this.versionEntityId,
          entityName: this.versionEntityName,
        } as AuditLogItemVO);
        // 重新加载审计日志
        await this.loadAuditLogs();
      } else {
        ElMessage.error(res.message);
      }
    } catch (error) {
      if (error !== 'cancel') {
        console.error('恢复版本失败:', error);
        ElMessage.error('恢复版本失败');
      }
    }
  }

  // 格式化操作类型显示
  getActionTypeTag(actionType: AuditActionType) {
    const map: Record<AuditActionType, { type: string; label: string }> = {
      [AuditActionType.CREATE]: { type: 'success', label: '创建' },
      [AuditActionType.UPDATE]: { type: 'warning', label: '更新' },
      [AuditActionType.DELETE]: { type: 'danger', label: '删除' },
      [AuditActionType.LOGIN]: { type: 'info', label: '登录' },
      [AuditActionType.LOGOUT]: { type: 'info', label: '登出' },
      [AuditActionType.RESTORE]: { type: 'primary', label: '恢复' },
    };
    return map[actionType] || { type: 'info', label: actionType };
  }

  // 格式化实体类型显示
  getEntityTypeName(entityType: string) {
    const map: Record<string, string> = {
      news: '新闻',
      project: '项目',
      media: '媒体文件',
      admin: '管理员',
      globalConfig: '全局配置',
    };
    return map[entityType] || entityType;
  }

  // 格式化时间
  formatTime(date: Date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  // 格式化 JSON 数据用于显示
  formatJson(data: any) {
    if (!data) return '-';
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }
}
</script>

<template>
  <div class="audit-log-container" v-loading="loading">
    <Head>
      <title>审计日志 - 管理后台</title>
    </Head>

    <div class="page-header">
      <h2>审计日志</h2>
      <p class="subtitle">查看所有管理员操作记录和数据变更历史</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <ElCard class="stat-card">
        <div class="stat-content">
          <div class="stat-icon">
            <FileText :size="24" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalLogs }}</div>
            <div class="stat-label">总操作记录</div>
          </div>
        </div>
      </ElCard>
      <ElCard class="stat-card">
        <div class="stat-content">
          <div class="stat-icon create">
            <FileText :size="24" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.actionTypeCounts?.CREATE || 0 }}</div>
            <div class="stat-label">创建操作</div>
          </div>
        </div>
      </ElCard>
      <ElCard class="stat-card">
        <div class="stat-content">
          <div class="stat-icon update">
            <RefreshCw :size="24" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.actionTypeCounts?.UPDATE || 0 }}</div>
            <div class="stat-label">更新操作</div>
          </div>
        </div>
      </ElCard>
      <ElCard class="stat-card">
        <div class="stat-content">
          <div class="stat-icon delete">
            <FileText :size="24" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.actionTypeCounts?.DELETE || 0 }}</div>
            <div class="stat-label">删除操作</div>
          </div>
        </div>
      </ElCard>
    </div>

    <!-- 筛选区域 -->
    <ElCard class="filter-card">
      <ElForm :inline="true" :model="filterForm" class="filter-form">
        <ElFormItem label="操作类型">
          <ElSelect v-model="filterForm.actionType" placeholder="选择操作类型" clearable style="width: 120px">
            <ElOption
              v-for="item in actionTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="实体类型">
          <ElSelect v-model="filterForm.entityType" placeholder="选择实体类型" clearable style="width: 120px">
            <ElOption
              v-for="item in entityTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="时间范围">
          <ElDatePicker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 260px"
          />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="handleSearch">
            <ElIcon><Search :size="16" /></ElIcon>
            搜索
          </ElButton>
          <ElButton @click="handleReset">
            <ElIcon><RefreshCw :size="16" /></ElIcon>
            重置
          </ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <!-- 日志列表 -->
    <ElCard class="list-card">
      <ElTable :data="auditLogs" style="width: 100%" stripe>
        <ElTableColumn label="时间" width="180">
          <template #default="{ row }">
            <div class="time-cell">
              <ElIcon><Clock :size="14" /></ElIcon>
              <span>{{ formatTime(row.createdAt) }}</span>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作者" width="140">
          <template #default="{ row }">
            <div class="admin-cell">
              <UserAvatar
                v-if="row.adminAvatar"
                :avatarUrl="row.adminAvatar"
                :size="24"
              />
              <ElIcon v-else><User :size="20" /></ElIcon>
              <span>{{ row.adminUsername || '系统' }}</span>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作类型" width="100">
          <template #default="{ row }">
            <ElTag :type="getActionTypeTag(row.actionType).type" size="small">
              {{ getActionTypeTag(row.actionType).label }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="实体类型" width="100">
          <template #default="{ row }">
            <span>{{ getEntityTypeName(row.entityType) }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="实体名称" min-width="180">
          <template #default="{ row }">
            <span class="entity-name">{{ row.entityName || '-' }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="描述" min-width="200">
          <template #default="{ row }">
            <span class="description">{{ row.description || '-' }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" link size="small" @click="viewLogDetail(row)">
              <ElIcon><Eye :size="14" /></ElIcon>
              详情
            </ElButton>
            <ElButton
              v-if="row.entityId && ['news', 'project', 'media', 'admin', 'globalConfig'].includes(row.entityType)"
              type="primary"
              link
              size="small"
              @click="viewVersionHistory(row)"
            >
              <ElIcon><History :size="14" /></ElIcon>
              版本
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="pagination-container">
        <ElPagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </ElCard>

    <!-- 日志详情对话框 -->
    <ElDialog
      v-model="detailDialogVisible"
      title="审计日志详情"
      width="700px"
      destroy-on-close
    >
      <template v-if="currentLog">
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="操作时间" :span="2">
            {{ formatTime(currentLog.createdAt) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="操作者">
            {{ currentLog.adminUsername || '系统' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="IP 地址">
            {{ currentLog.ipAddress || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="操作类型">
            <ElTag :type="getActionTypeTag(currentLog.actionType).type">
              {{ getActionTypeTag(currentLog.actionType).label }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="实体类型">
            {{ getEntityTypeName(currentLog.entityType) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="实体 ID">
            {{ currentLog.entityId || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="实体名称">
            {{ currentLog.entityName || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="操作描述" :span="2">
            {{ currentLog.description || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="User Agent" :span="2">
            <div class="user-agent">{{ currentLog.userAgent || '-' }}</div>
          </ElDescriptionsItem>
        </ElDescriptions>

        <ElTabs v-if="currentLog.oldData || currentLog.newData" style="margin-top: 16px">
          <ElTabPane label="变更前数据" v-if="currentLog.oldData">
            <pre class="json-data">{{ formatJson(currentLog.oldData) }}</pre>
          </ElTabPane>
          <ElTabPane label="变更后数据" v-if="currentLog.newData">
            <pre class="json-data">{{ formatJson(currentLog.newData) }}</pre>
          </ElTabPane>
        </ElTabs>
      </template>
    </ElDialog>

    <!-- 版本历史对话框 -->
    <ElDialog
      v-model="versionDialogVisible"
      :title="`版本历史 - ${versionEntityName}`"
      width="800px"
      destroy-on-close
    >
      <div v-loading="versionLoading">
        <ElEmpty v-if="versionHistory.length === 0" description="暂无版本历史" />

        <ElTimeline v-else>
          <ElTimelineItem
            v-for="version in versionHistory"
            :key="version.id"
            :type="version.isCurrent ? 'primary' : version.isDeleted ? 'danger' : 'info'"
            :hollow="!version.isCurrent"
          >
            <div class="version-item">
              <div class="version-header">
                <span class="version-number">版本 {{ version.version }}</span>
                <ElTag v-if="version.isCurrent" type="success" size="small">当前版本</ElTag>
                <ElTag v-if="version.isDeleted" type="danger" size="small">已删除</ElTag>
                <span class="version-time">{{ formatTime(version.createdAt) }}</span>
              </div>
              <div class="version-info">
                <span class="change-summary">{{ version.changeSummary || '无变更说明' }}</span>
                <span class="version-admin">
                  <ElIcon><User :size="12" /></ElIcon>
                  {{ version.adminUsername || '系统' }}
                </span>
              </div>
              <div class="version-actions">
                <ElButton type="primary" link size="small" @click="viewVersionDetail(version)">
                  <ElIcon><Eye :size="14" /></ElIcon>
                  查看
                </ElButton>
                <ElButton
                  v-if="!version.isCurrent"
                  type="primary"
                  link
                  size="small"
                  @click="compareWithCurrent(version)"
                >
                  对比
                </ElButton>
                <ElButton
                  v-if="!version.isCurrent"
                  type="warning"
                  link
                  size="small"
                  @click="restoreVersion(version)"
                >
                  <ElIcon><RotateCcw :size="14" /></ElIcon>
                  恢复
                </ElButton>
              </div>
            </div>
          </ElTimelineItem>
        </ElTimeline>
      </div>
    </ElDialog>

    <!-- 版本详情/对比对话框 -->
    <ElDialog
      v-model="versionDetailDialogVisible"
      :title="compareMode ? '版本对比' : '版本详情'"
      width="900px"
      destroy-on-close
    >
      <template v-if="currentVersion">
        <div v-if="!compareMode">
          <ElDescriptions :column="2" border>
            <ElDescriptionsItem label="版本号">
              {{ currentVersion.version }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="创建时间">
              {{ formatTime(currentVersion.createdAt) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="操作者">
              {{ currentVersion.adminUsername || '系统' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="状态">
              <ElTag v-if="currentVersion.isCurrent" type="success">当前版本</ElTag>
              <ElTag v-else-if="currentVersion.isDeleted" type="danger">已删除</ElTag>
              <ElTag v-else type="info">历史版本</ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="变更说明" :span="2">
              {{ currentVersion.changeSummary || '-' }}
            </ElDescriptionsItem>
          </ElDescriptions>
          <div class="version-data">
            <h4>快照数据</h4>
            <pre class="json-data">{{ formatJson(currentVersion.snapshotData) }}</pre>
          </div>
        </div>

        <div v-else class="compare-container">
          <div class="compare-header">
            <div class="compare-col">
              <h4>版本 {{ currentVersion.version }} ({{ formatTime(currentVersion.createdAt) }})</h4>
            </div>
            <div class="compare-col">
              <h4 v-if="compareVersion">版本 {{ compareVersion.version }} (当前版本)</h4>
            </div>
          </div>

          <div v-if="versionDiff && Object.keys(versionDiff).length > 0" class="diff-list">
            <div v-for="(diff, key) in versionDiff" :key="key" class="diff-item">
              <div class="diff-key">{{ key }}</div>
              <div class="diff-values">
                <div class="diff-old">
                  <span class="diff-label">旧值:</span>
                  <pre>{{ formatJson(diff.old) }}</pre>
                </div>
                <div class="diff-new">
                  <span class="diff-label">新值:</span>
                  <pre>{{ formatJson(diff.new) }}</pre>
                </div>
              </div>
            </div>
          </div>
          <ElEmpty v-else description="两个版本数据相同" />
        </div>
      </template>
    </ElDialog>
  </div>
</template>

<style lang="less" scoped>
.audit-log-container {
  padding: 20px;

  .page-header {
    margin-bottom: 20px;

    h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
    }

    .subtitle {
      margin: 0;
      color: #909399;
      font-size: 14px;
    }
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 20px;

    .stat-card {
      .stat-content {
        display: flex;
        align-items: center;
        gap: 16px;

        .stat-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f0f2f5;
          border-radius: 8px;
          color: #409eff;

          &.create {
            background: #e8f5e9;
            color: #67c23a;
          }

          &.update {
            background: #fff3e0;
            color: #e6a23c;
          }

          &.delete {
            background: #ffebee;
            color: #f56c6c;
          }
        }

        .stat-info {
          .stat-value {
            font-size: 24px;
            font-weight: 600;
            color: #303133;
          }

          .stat-label {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }

  .filter-card {
    margin-bottom: 20px;

    .filter-form {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  }

  .list-card {
    .time-cell {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #606266;
      font-size: 13px;
    }

    .admin-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .entity-name {
      font-weight: 500;
    }

    .description {
      color: #606266;
      font-size: 13px;
    }
  }

  .pagination-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}

.json-data {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  max-height: 300px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.user-agent {
  font-size: 12px;
  color: #909399;
  word-break: break-all;
}

.version-item {
  .version-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;

    .version-number {
      font-weight: 600;
      font-size: 14px;
    }

    .version-time {
      color: #909399;
      font-size: 12px;
      margin-left: auto;
    }
  }

  .version-info {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 13px;
    color: #606266;
    margin-bottom: 8px;

    .change-summary {
      flex: 1;
    }

    .version-admin {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #909399;
    }
  }

  .version-actions {
    display: flex;
    gap: 8px;
  }
}

.version-data {
  margin-top: 16px;

  h4 {
    margin: 0 0 8px 0;
    font-size: 14px;
    font-weight: 600;
  }
}

.compare-container {
  .compare-header {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;

    h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      padding: 12px;
      background: #f5f7fa;
      border-radius: 4px;
    }
  }

  .diff-list {
    .diff-item {
      border: 1px solid #ebeef5;
      border-radius: 4px;
      margin-bottom: 12px;
      overflow: hidden;

      .diff-key {
        background: #f5f7fa;
        padding: 8px 12px;
        font-weight: 600;
        font-size: 13px;
        border-bottom: 1px solid #ebeef5;
      }

      .diff-values {
        display: grid;
        grid-template-columns: 1fr 1fr;

        .diff-old,
        .diff-new {
          padding: 12px;

          .diff-label {
            display: block;
            font-size: 12px;
            color: #909399;
            margin-bottom: 4px;
          }

          pre {
            margin: 0;
            font-size: 12px;
            white-space: pre-wrap;
            word-break: break-all;
          }
        }

        .diff-old {
          background: #fef0f0;
          border-right: 1px solid #ebeef5;
        }

        .diff-new {
          background: #f0f9eb;
        }
      }
    }
  }
}
</style>
