<script lang="ts">
import { Vue, Options } from 'vue-class-component';
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
  ElSkeleton,
  ElSkeletonItem,
  vLoading,
} from 'element-plus';
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
import { resolve } from 'path';

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
    ElSkeleton,
    ElSkeletonItem,
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
    { value: '', label: 'All' },
    { value: AuditActionType.CREATE, label: 'Create' },
    { value: AuditActionType.UPDATE, label: 'Update' },
    { value: AuditActionType.DELETE, label: 'Delete' },
    { value: AuditActionType.LOGIN, label: 'Login' },
    { value: AuditActionType.LOGOUT, label: 'Logout' },
    { value: AuditActionType.RESTORE, label: 'Restore' },
  ];

  // 实体类型选项
  entityTypeOptions = [
    { value: '', label: 'All' },
    { value: 'news', label: 'News' },
    { value: 'news_category', label: 'News Category' },
    { value: 'project', label: 'Project' },
    { value: 'media', label: 'Media File' },
    { value: 'admin', label: 'Admin' },
    { value: 'globalConfig', label: 'HomePage' },
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
      ElMessage.error('Failed to load audit logs');
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
      ElMessage.warning('This operation has no associated entity.');
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
      ElMessage.error('Failed to load version history');
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
      ElMessage.info('This is already the current version');
      return;
    }

    const currentVersion = this.versionHistory.find((v) => v.isCurrent);
    if (!currentVersion) {
      ElMessage.warning('Current version not found');
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
      ElMessage.error('Failed to compare versions');
    }
  }

  async restoreVersion(version: DataVersionItemVO) {
    if (version.isCurrent) {
      ElMessage.info('This is already the current version, no need to restore');
      return;
    }

    try {
      await ElMessageBox.confirm(
        `Are you sure you want to restore "${this.versionEntityName}" to version ${version.version}? This will create a new version record.`,
        'Confirm',
        {
          confirmButtonText: 'Confirm',
          cancelButtonText: 'Cancel',
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
        ElMessage.error('Failed to restore version');
      }
    }
  }

  getActionTypeTag(actionType: AuditActionType) {
    const map: Record<AuditActionType, { type: string; label: string }> = {
      [AuditActionType.CREATE]: { type: 'success', label: 'Create' },
      [AuditActionType.UPDATE]: { type: 'warning', label: 'Update' },
      [AuditActionType.DELETE]: { type: 'danger', label: 'Delete' },
      [AuditActionType.LOGIN]: { type: 'info', label: 'Login' },
      [AuditActionType.LOGOUT]: { type: 'info', label: 'Logout' },
      [AuditActionType.RESTORE]: { type: 'primary', label: 'Restore' },
    };
    return map[actionType] || { type: 'info', label: actionType };
  }

  getEntityTypeName(entityType: string) {
    const map: Record<string, string> = {
      news: 'News',
      news_category: 'News Category',
      project: 'Project',
      media: 'Media File',
      admin: 'Admin',
      globalConfig: 'HomePage',
    };
    return map[entityType] || entityType;
  }

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
  <div class="audit-log-container">
    <!-- 骨架屏 -->
    <template v-if="loading">
      <!-- 统计卡片骨架屏 -->
      <div class="stats-row">
        <ElCard v-for="i in 4" :key="'stat-skeleton-' + i" class="stat-card" shadow="never">
          <el-skeleton :rows="0" animated>
            <template #template>
              <div class="stat-content">
                <el-skeleton-item variant="rect" style="width: 48px; height: 48px; border-radius: 8px;" />
                <div class="stat-info">
                  <el-skeleton-item variant="h1" style="width: 60px; height: 28px; margin-bottom: 4px;" />
                  <el-skeleton-item variant="text" style="width: 70px; height: 14px;" />
                </div>
              </div>
            </template>
          </el-skeleton>
        </ElCard>
      </div>

      <!-- 筛选区域骨架屏 -->
      <ElCard class="filter-card" shadow="never">
        <el-skeleton :rows="0" animated>
          <template #template>
            <div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: center;">
              <el-skeleton-item variant="text" style="width: 60px; height: 14px;" />
              <el-skeleton-item variant="rect" style="width: 120px; height: 32px; border-radius: 4px;" />
              <el-skeleton-item variant="text" style="width: 60px; height: 14px;" />
              <el-skeleton-item variant="rect" style="width: 120px; height: 32px; border-radius: 4px;" />
              <el-skeleton-item variant="text" style="width: 60px; height: 14px;" />
              <el-skeleton-item variant="rect" style="width: 260px; height: 32px; border-radius: 4px;" />
              <el-skeleton-item variant="button" style="width: 70px; height: 32px; border-radius: 4px;" />
              <el-skeleton-item variant="button" style="width: 70px; height: 32px; border-radius: 4px;" />
            </div>
          </template>
        </el-skeleton>
      </ElCard>

      <!-- 表格骨架屏 -->
      <ElCard class="list-card" shadow="hover">
        <div class="table-skeleton">
          <el-skeleton :rows="0" animated>
            <template #template>
              <!-- 表头骨架 -->
              <div class="skeleton-table-header">
                <el-skeleton-item variant="text" style="width: 120px; height: 16px;" />
                <el-skeleton-item variant="text" style="width: 100px; height: 16px;" />
                <el-skeleton-item variant="text" style="width: 70px; height: 16px;" />
                <el-skeleton-item variant="text" style="width: 70px; height: 16px;" />
                <el-skeleton-item variant="text" style="width: 140px; height: 16px;" />
                <el-skeleton-item variant="text" style="width: 160px; height: 16px;" />
                <el-skeleton-item variant="text" style="width: 120px; height: 16px;" />
              </div>
              <!-- 表格行骨架 -->
              <div v-for="i in 10" :key="'table-skeleton-row-' + i" class="skeleton-table-row">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <el-skeleton-item variant="circle" style="width: 14px; height: 14px;" />
                  <el-skeleton-item variant="text" style="width: 100px; height: 14px;" />
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <el-skeleton-item variant="circle" style="width: 24px; height: 24px;" />
                  <el-skeleton-item variant="text" style="width: 60px; height: 14px;" />
                </div>
                <el-skeleton-item variant="button" style="width: 50px; height: 22px; border-radius: 4px;" />
                <el-skeleton-item variant="text" style="width: 50px; height: 14px;" />
                <el-skeleton-item variant="text" style="width: 120px; height: 14px;" />
                <el-skeleton-item variant="text" style="width: 140px; height: 14px;" />
                <div style="display: flex; gap: 8px;">
                  <el-skeleton-item variant="text" style="width: 40px; height: 14px;" />
                  <el-skeleton-item variant="text" style="width: 40px; height: 14px;" />
                </div>
              </div>
            </template>
          </el-skeleton>
        </div>

        <!-- 分页器骨架屏 -->
        <div class="pagination-container">
          <el-skeleton :rows="0" animated style="display: flex; gap: 8px; justify-content: flex-end;">
            <template #template>
              <el-skeleton-item variant="text" style="width: 60px; height: 28px;" />
              <el-skeleton-item variant="rect" style="width: 100px; height: 28px; border-radius: 4px;" />
              <el-skeleton-item variant="button" style="width: 32px; height: 32px; border-radius: 4px;" />
              <el-skeleton-item variant="button" style="width: 32px; height: 32px; border-radius: 4px;" />
              <el-skeleton-item variant="button" style="width: 32px; height: 32px; border-radius: 4px;" />
              <el-skeleton-item variant="button" style="width: 32px; height: 32px; border-radius: 4px;" />
              <el-skeleton-item variant="rect" style="width: 100px; height: 28px; border-radius: 4px;" />
            </template>
          </el-skeleton>
        </div>
      </ElCard>
    </template>

    <!-- 实际内容 -->
    <template v-else>
      <!-- 统计卡片 -->
      <div class="stats-row">
      <ElCard class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon">
            <FileText :size="24" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalLogs }}</div>
            <div class="stat-label">All</div>
          </div>
        </div>
      </ElCard>
      <ElCard class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon create">
            <FileText :size="24" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.actionTypeCounts?.CREATE || 0 }}</div>
            <div class="stat-label">Create</div>
          </div>
        </div>
      </ElCard>
      <ElCard class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon update">
            <RefreshCw :size="24" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.actionTypeCounts?.UPDATE || 0 }}</div>
            <div class="stat-label">Update</div>
          </div>
        </div>
      </ElCard>
      <ElCard class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon delete">
            <FileText :size="24" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.actionTypeCounts?.DELETE || 0 }}</div>
            <div class="stat-label">Delete</div>
          </div>
        </div>
      </ElCard>
    </div>

    <!-- 筛选区域 -->
    <ElCard class="filter-card" shadow="hover">
      <ElForm :inline="true" :model="filterForm" class="filter-form">
        <ElFormItem label="Operate Type">
          <ElSelect v-model="filterForm.actionType" clearable style="width: 120px">
            <ElOption
              v-for="item in actionTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="Entity Type">
          <ElSelect v-model="filterForm.entityType" clearable style="width: 120px">
            <ElOption
              v-for="item in entityTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="Time Range">
          <ElDatePicker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="Start Date"
            end-placeholder="End Date"
            style="width: 260px"
          />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="handleSearch">
            <ElIcon><Search :size="16" /></ElIcon>
            <span>Search</span>
          </ElButton>
          <ElButton @click="handleReset">
            <ElIcon><RefreshCw :size="16" /></ElIcon>
            <span>Reset</span>
          </ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <!-- 日志列表 -->
    <ElCard class="list-card" shadow="hover">
      <ElTable :data="auditLogs" style="width: 100%" stripe>
        <ElTableColumn label="Time" width="180">
          <template #default="{ row }">
            <div class="time-cell">
              <ElIcon><Clock :size="14" /></ElIcon>
              <span>{{ formatTime(row.createdAt) }}</span>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="Operator" width="150">
          <template #default="{ row }">
            <div class="admin-cell">
              <UserAvatar
                v-if="row.adminAvatar"
                :avatarUrl="row.adminAvatar"
                :size="24"
              />
              <ElIcon v-else><User :size="20" /></ElIcon>
              <span>{{ row.adminUsername || 'System' }}</span>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="Operate Type" width="150">
          <template #default="{ row }">
            <ElTag :type="getActionTypeTag(row.actionType).type" size="small">
              {{ getActionTypeTag(row.actionType).label }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="Entity Type" width="100">
          <template #default="{ row }">
            <span>{{ getEntityTypeName(row.entityType) }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="Entity Name" min-width="180">
          <template #default="{ row }">
            <span class="entity-name">{{ row.entityName || '-' }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="Description" min-width="250">
          <template #default="{ row }">
            <span class="description">{{ row.description || '-' }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="Actions" width="180" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" link size="small" @click="viewLogDetail(row)">
              <ElIcon><Eye :size="14" /></ElIcon>
              <span>Det.</span>
            </ElButton>
            <ElButton
              v-if="row.entityId && ['news', 'news_category', 'project', 'media', 'admin', 'globalConfig'].includes(row.entityType)"
              type="primary"
              link
              size="small"
              @click="viewVersionHistory(row)"
            >
              <ElIcon><History :size="14" /></ElIcon>
              <span>Ver.</span>
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="pagination-container">
        <ElPagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </ElCard>

    <!-- 日志详情对话框 -->
    <ElDialog
      v-model="detailDialogVisible"
      title="Details"
      width="700px"
      destroy-on-close
    >
      <template v-if="currentLog">
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="Operation Time" :span="2">
            {{ formatTime(currentLog.createdAt) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="Operator">
            {{ currentLog.adminUsername || 'System' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="IP Address">
            {{ currentLog.ipAddress || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="Operation Type">
            <ElTag :type="getActionTypeTag(currentLog.actionType).type">
              {{ getActionTypeTag(currentLog.actionType).label }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="Entity Type">
            {{ getEntityTypeName(currentLog.entityType) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="Entity ID">
            {{ currentLog.entityId || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="Entity Name">
            {{ currentLog.entityName || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="Operation Description" :span="2">
            {{ currentLog.description || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="User Agent" :span="2">
            <div class="user-agent">{{ currentLog.userAgent || '-' }}</div>
          </ElDescriptionsItem>
        </ElDescriptions>

        <ElTabs v-if="currentLog.oldData || currentLog.newData" style="margin-top: 16px">
          <ElTabPane label="Old Data" v-if="currentLog.oldData">
            <pre class="json-data">{{ formatJson(currentLog.oldData) }}</pre>
          </ElTabPane>
          <ElTabPane label="New Data" v-if="currentLog.newData">
            <pre class="json-data">{{ formatJson(currentLog.newData) }}</pre>
          </ElTabPane>
        </ElTabs>
      </template>
    </ElDialog>

    <!-- 版本历史对话框 -->
    <ElDialog
      v-model="versionDialogVisible"
      :title="`Version History - ${versionEntityName}`"
      width="800px"
      destroy-on-close
    >
      <div v-loading="versionLoading">
        <ElEmpty v-if="versionHistory.length === 0" description="No version history available" />

        <ElTimeline v-else>
          <ElTimelineItem
            v-for="version in versionHistory"
            :key="version.id"
            :type="version.isCurrent ? 'primary' : version.isDeleted ? 'danger' : 'info'"
            :hollow="!version.isCurrent"
          >
            <div class="version-item">
              <div class="version-header">
                <span class="version-number">Version {{ version.version }}</span>
                <ElTag v-if="version.isCurrent" type="success" size="small">Current Version</ElTag>
                <ElTag v-if="version.isDeleted" type="danger" size="small">Deleted</ElTag>
                <span class="version-time">{{ formatTime(version.createdAt) }}</span>
              </div>
              <div class="version-info">
                <span class="change-summary">{{ version.changeSummary || 'No Change Summary' }}</span>
                <span class="version-admin">
                  <ElIcon><User :size="12" /></ElIcon>
                  {{ version.adminUsername || 'System' }}
                </span>
              </div>
              <div class="version-actions">
                <ElButton type="primary" link size="small" @click="viewVersionDetail(version)">
                  <ElIcon><Eye :size="14" /></ElIcon>
                  <span>View</span>
                </ElButton>
                <ElButton
                  v-if="!version.isCurrent"
                  type="primary"
                  link
                  size="small"
                  @click="compareWithCurrent(version)"
                >
                  <span>Compare</span>
                </ElButton>
                <ElButton
                  v-if="!version.isCurrent"
                  type="warning"
                  link
                  size="small"
                  @click="restoreVersion(version)"
                >
                  <ElIcon><RotateCcw :size="14" /></ElIcon>
                  <span>Restore</span>
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
      :title="compareMode ? 'Version Comparison' : 'Version Details'"
      width="900px"
      destroy-on-close
    >
      <template v-if="currentVersion">
        <div v-if="!compareMode">
          <ElDescriptions :column="2" border>
            <ElDescriptionsItem label="Version Number">
              {{ currentVersion.version }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="Created At">
              {{ formatTime(currentVersion.createdAt) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="Operator">
              {{ currentVersion.adminUsername || 'System' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="Status">
              <ElTag v-if="currentVersion.isCurrent" type="success">Current Version</ElTag>
              <ElTag v-else-if="currentVersion.isDeleted" type="danger">Deleted</ElTag>
              <ElTag v-else type="info">Historical Version</ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="Change Summary" :span="2">
              {{ currentVersion.changeSummary || '-' }}
            </ElDescriptionsItem>
          </ElDescriptions>
          <div class="version-data">
            <h4>Snapshot</h4>
            <pre class="json-data">{{ formatJson(currentVersion.snapshotData) }}</pre>
          </div>
        </div>

        <div v-else class="compare-container">
          <div class="compare-header">
            <div class="compare-col">
              <h4>Version {{ currentVersion.version }} ({{ formatTime(currentVersion.createdAt) }})</h4>
            </div>
            <div class="compare-col">
              <h4 v-if="compareVersion">Version {{ compareVersion.version }} (Current Version)</h4>
            </div>
          </div>

          <div v-if="versionDiff && Object.keys(versionDiff).length > 0" class="diff-list">
            <div v-for="(diff, key) in versionDiff" :key="key" class="diff-item">
              <div class="diff-key">{{ key }}</div>
              <div class="diff-values">
                <div class="diff-old">
                  <span class="diff-label">Old Data:</span>
                  <pre>{{ formatJson(diff.old) }}</pre>
                </div>
                <div class="diff-new">
                  <span class="diff-label">New Data:</span>
                  <pre>{{ formatJson(diff.new) }}</pre>
                </div>
              </div>
            </div>
          </div>
          <ElEmpty v-else description="Two versions have identical data" />
        </div>
      </template>
    </ElDialog>
    </template>
  </div>
</template>

<style lang="less" scoped>
.audit-log-container {
  width: 100%;
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
          background: var(--ah-c-background-bg);
          border-radius: 8px;
          color: #409eff;

          &.create {
            color: #67c23a;
          }

          &.update {
            color: #e6a23c;
          }

          &.delete {
            color: #f56c6c;
          }
        }

        .stat-info {
          .stat-value {
            font-size: 24px;
            font-weight: 600;
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

    .table-skeleton {
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 4px;

      .skeleton-table-header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 12px 16px;
        background: var(--el-fill-color-light);
        border-bottom: 1px solid var(--el-border-color-lighter);
      }

      .skeleton-table-row {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 14px 16px;
        border-bottom: 1px solid var(--el-border-color-lighter);

        &:last-child {
          border-bottom: none;
        }

        &:nth-child(odd) {
          background: var(--el-fill-color-lighter);
        }
      }
    }
  }

  .pagination-container {
    display: flex;
    justify-content: flex-end;
  }
}

.json-data {
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
      border-radius: 4px;
    }
  }

  .diff-list {
    .diff-item {
      border: 1px solid var(--el-border-color);
      border-radius: 4px;
      margin-bottom: 12px;
      overflow: hidden;

      .diff-key {
        // background: #f5f7fa;
        padding: 8px 12px;
        font-weight: 600;
        font-size: 13px;
        border-bottom: 1px solid var(--el-border-color);
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
            color: var(--el-text-color-secondary);
            margin-bottom: 4px;
          }

          pre {
            margin: 0;
            font-size: 12px;
            white-space: pre-wrap;
            word-break: break-all;
            color: var(--el-text-color-primary);
          }
        }

        .diff-old {
          background: var(--el-color-danger-light-9);
          border-right: 1px solid var(--el-border-color);

          pre {
            color: var(--el-color-danger);
          }
        }

        .diff-new {
          background: var(--el-color-success-light-9);

          pre {
            color: var(--el-color-success);
          }
        }
      }
    }
  }
}
</style>
