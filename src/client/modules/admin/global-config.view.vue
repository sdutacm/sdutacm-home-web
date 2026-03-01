<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { GetGlobalConfigResDTO } from '@common/modules/global-config/global-config.dto';
import {
  ElForm,
  ElInput,
  ElFormItem,
  ElImage,
  ElButton,
  ElMessage,
  ElTransfer,
  ElLoading,
  ElSkeleton,
  ElSkeletonItem,
} from 'element-plus';
import { View, ChildOf, RenderMethod, RenderMethodKind } from 'bwcx-client-vue3';
import { Head } from '@vueuse/head';
import SelectMediaDialog from '@client/components/admin/select-logo-dialog.vue';
import { MediaTypeEnum } from '@common/enums/media-type.enum';

interface NewsItem {
  id: number;
  title: string;
  isPublished: boolean;
}

interface ProjectItem {
  id: number;
  name: string;
  isFeatured: boolean;
}

interface TransferItem {
  key: number;
  label: string;
  disabled: boolean;
}

@View('/admin/global-config')
@ChildOf('AdminView')
@RenderMethod(RenderMethodKind.CSR)
@Options({
  components: {
    Head,
    ElForm,
    ElInput,
    ElFormItem,
    ElImage,
    ElButton,
    ElMessage,
    SelectMediaDialog,
    ElTransfer,
    ElSkeleton,
    ElSkeletonItem,
  },
})
export default class GlobalConfigView extends Vue {
  loading: boolean = true;
  globalConfigState: GetGlobalConfigResDTO = {
    title: '',
    slogan: '',
    description: '',
    logoUrl: '',
    homeNewsPreviewIds: [],
    homeProjectsPreviewIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // 原始配置状态，用于检测是否有未保存的更改
  originalConfigState: GetGlobalConfigResDTO | null = null;
  originalNewsIds: number[] = [];
  originalProjectIds: number[] = [];

  selectLogoDialogVisible = false;
  allNews: NewsItem[] = [];
  selectedNewsIds: number[] = [];
  allProjects: ProjectItem[] = [];
  selectedProjectIds: number[] = [];

  // 暴露 MediaTypeEnum 给模板使用
  MediaTypeEnum = MediaTypeEnum;

  showSelectLogoDialog() {
    this.selectLogoDialogVisible = true;
  }

  handleLogoSelect(logo: any) {
    this.globalConfigState.logoUrl = logo.path;
  }

  get newsTransferData(): TransferItem[] {
    // 只显示已发布的新闻
    return this.allNews
      .filter((news) => news.isPublished)
      .map((news) => ({
        key: news.id,
        label: news.title,
        disabled: false,
      }));
  }

  get projectsTransferData(): TransferItem[] {
    // 显示所有项目
    return this.allProjects.map((project) => ({
      key: project.id,
      label: project.name,
      disabled: false,
    }));
  }

  get hasUnsavedChanges(): boolean {
    if (!this.originalConfigState) return false;

    // 检查基本字段是否有变化
    const basicFieldsChanged =
      this.globalConfigState.title !== this.originalConfigState.title ||
      this.globalConfigState.slogan !== this.originalConfigState.slogan ||
      this.globalConfigState.description !== this.originalConfigState.description ||
      this.globalConfigState.logoUrl !== this.originalConfigState.logoUrl;

    // 检查新闻选择是否有变化
    const newsChanged =
      this.selectedNewsIds.length !== this.originalNewsIds.length ||
      !this.selectedNewsIds.every((id) => this.originalNewsIds.includes(id));

    // 检查项目选择是否有变化
    const projectsChanged =
      this.selectedProjectIds.length !== this.originalProjectIds.length ||
      !this.selectedProjectIds.every((id) => this.originalProjectIds.includes(id));

    return basicFieldsChanged || newsChanged || projectsChanged;
  }

  handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (this.hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = '';
      return '';
    }
  };

  async loadNewsList() {
    try {
      const res = await this.$api.getAllNews({});
      this.allNews = res.rows;
    } catch (error) {
      console.error('Failed to load news list:', error);
    }
  }

  async loadProjectsList() {
    try {
      const res = await this.$api.getAllProjects({});
      this.allProjects = res.rows;
    } catch (error) {
      console.error('Failed to load projects list:', error);
    }
  }

  async saveConfig() {
    if (this.selectedNewsIds.length !== 5) {
      ElMessage.warning('The homepage news preview must select exactly 5 items.');
      return;
    }

    if (this.selectedProjectIds.length !== 3) {
      ElMessage.warning('The homepage projects preview must select exactly 3 items.');
      return;
    }

    const loading = ElLoading.service({ fullscreen: true, text: 'Saving...' });
    try {
      const updateData: any = {
        title: this.globalConfigState.title,
        slogan: this.globalConfigState.slogan,
        description: this.globalConfigState.description,
        logoPath: this.globalConfigState.logoUrl,
        homeNewsPreviewIds: this.selectedNewsIds,
        homeProjectsPreviewIds: this.selectedProjectIds,
      };

      await this.$api.updateGlobalConfig(updateData);

      // 重新加载配置以获取最新数据
      const newConfig = await this.$api.getGlobalConfig();
      Object.assign(this.globalConfigState, newConfig);
      this.selectedNewsIds = newConfig.homeNewsPreviewIds || [];
      this.selectedProjectIds = newConfig.homeProjectsPreviewIds || [];

      // 更新原始状态
      this.originalConfigState = { ...newConfig };
      this.originalNewsIds = [...this.selectedNewsIds];
      this.originalProjectIds = [...this.selectedProjectIds];

      ElMessage.success('Configuration saved successfully');
    } catch (e) {
      console.error('Failed to save global config:', e);
      ElMessage.error('Failed to save configuration, please try again');
    } finally {
      loading.close();
    }
  }

  async mounted() {
    try {
      this.globalConfigState = await this.$api.getGlobalConfig();
      console.log('当前全局配置:', { ...this.globalConfigState });
      await this.loadNewsList();
      await this.loadProjectsList();
      this.selectedNewsIds = this.globalConfigState?.homeNewsPreviewIds || [];
      this.selectedProjectIds = this.globalConfigState?.homeProjectsPreviewIds || [];

      // 保存原始状态
      this.originalConfigState = { ...this.globalConfigState };
      this.originalNewsIds = [...this.selectedNewsIds];
      this.originalProjectIds = [...this.selectedProjectIds];

      window.addEventListener('beforeunload', this.handleBeforeUnload);
    } finally {
      this.loading = false;
    }
  }

  beforeUnmount() {
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  }

  beforeRouteLeave(to: any, from: any, next: any) {
    if (this.hasUnsavedChanges) {
      const answer = window.confirm('You have unsaved changes, are you sure you want to leave?');
      if (answer) {
        next();
      } else {
        next(false);
      }
    } else {
      next();
    }
  }
}
</script>

<template>
  <Head>
    <title>SDUTACM Admin | Homepage Config</title>
    <meta name="description" content="SDUTACM 管理后台首页配置" />
  </Head>

  <div class="global-config-container">
    <!-- 骨架屏 -->
    <div v-if="loading" class="config-layout">
      <!-- 左侧骨架 -->
      <div class="config-left">
        <el-skeleton :rows="0" animated>
          <template #template>
            <div class="section-title-skeleton">
              <el-skeleton-item variant="text" style="width: 100px; height: 14px;" />
            </div>
            <!-- Logo -->
            <div class="form-item-skeleton">
              <el-skeleton-item variant="text" style="width: 40px; height: 14px; margin-bottom: 8px;" />
              <div style="display: flex; align-items: center; gap: 20px;">
                <el-skeleton-item variant="rect" style="width: 80px; height: 80px; border-radius: 10px;" />
                <el-skeleton-item variant="button" style="width: 90px; height: 32px; border-radius: 4px;" />
              </div>
            </div>
            <!-- Title -->
            <div class="form-item-skeleton">
              <el-skeleton-item variant="text" style="width: 35px; height: 14px; margin-bottom: 8px;" />
              <el-skeleton-item variant="rect" style="width: 100%; height: 32px; border-radius: 4px;" />
            </div>
            <!-- Slogan -->
            <div class="form-item-skeleton">
              <el-skeleton-item variant="text" style="width: 50px; height: 14px; margin-bottom: 8px;" />
              <el-skeleton-item variant="rect" style="width: 100%; height: 32px; border-radius: 4px;" />
            </div>
            <!-- Description -->
            <div class="form-item-skeleton" style="flex: 1;">
              <el-skeleton-item variant="text" style="width: 75px; height: 14px; margin-bottom: 8px;" />
              <el-skeleton-item variant="rect" style="width: 100%; height: 120px; border-radius: 4px;" />
            </div>
            <!-- Save Button -->
            <div style="margin-top: auto; padding-top: 16px;">
              <el-skeleton-item variant="button" style="width: 70px; height: 32px; border-radius: 4px;" />
            </div>
          </template>
        </el-skeleton>
      </div>
      <!-- 右侧骨架 -->
      <div class="config-right">
        <!-- News Transfer Skeleton -->
        <div class="transfer-section">
          <el-skeleton :rows="0" animated>
            <template #template>
              <div class="section-title-skeleton">
                <el-skeleton-item variant="text" style="width: 100px; height: 14px;" />
              </div>
              <div class="transfer-skeleton">
                <el-skeleton-item variant="rect" style="width: 280px; height: 280px; border-radius: 4px;" />
                <div style="display: flex; flex-direction: column; gap: 8px; padding: 0 16px;">
                  <el-skeleton-item variant="button" style="width: 32px; height: 32px; border-radius: 4px;" />
                  <el-skeleton-item variant="button" style="width: 32px; height: 32px; border-radius: 4px;" />
                </div>
                <el-skeleton-item variant="rect" style="width: 280px; height: 280px; border-radius: 4px;" />
              </div>
              <el-skeleton-item variant="text" style="width: 280px; height: 12px; margin-top: 12px;" />
            </template>
          </el-skeleton>
        </div>
        <!-- Projects Transfer Skeleton -->
        <div class="transfer-section">
          <el-skeleton :rows="0" animated>
            <template #template>
              <div class="section-title-skeleton">
                <el-skeleton-item variant="text" style="width: 120px; height: 14px;" />
              </div>
              <div class="transfer-skeleton">
                <el-skeleton-item variant="rect" style="width: 280px; height: 280px; border-radius: 4px;" />
                <div style="display: flex; flex-direction: column; gap: 8px; padding: 0 16px;">
                  <el-skeleton-item variant="button" style="width: 32px; height: 32px; border-radius: 4px;" />
                  <el-skeleton-item variant="button" style="width: 32px; height: 32px; border-radius: 4px;" />
                </div>
                <el-skeleton-item variant="rect" style="width: 280px; height: 280px; border-radius: 4px;" />
              </div>
              <el-skeleton-item variant="text" style="width: 200px; height: 12px; margin-top: 12px;" />
            </template>
          </el-skeleton>
        </div>
      </div>
    </div>

    <!-- 实际内容 -->
    <div class="config-layout" v-else>
      <!-- 左侧：基础配置 -->
      <div class="config-left">
        <div class="section-title">Basic Settings</div>
        <el-form :model="globalConfigState" label-position="top">
          <el-form-item label="Logo">
            <div class="logo-wrapper">
              <el-image class="logo-preview" :src="globalConfigState.logoUrl" fit="contain" />
              <el-button size="small" @click="showSelectLogoDialog">Select Logo</el-button>
            </div>
          </el-form-item>
          <el-form-item label="Title" required>
            <el-input v-model="globalConfigState.title" placeholder="Enter website title"></el-input>
          </el-form-item>
          <el-form-item label="Slogan" required>
            <el-input v-model="globalConfigState.slogan" placeholder="Enter website slogan"></el-input>
          </el-form-item>
          <el-form-item label="Description" required class="description-form-item">
            <el-input
              class="description-textarea"
              type="textarea"
              v-model="globalConfigState.description"
              placeholder="Enter website description"
              resize="none"
            ></el-input>
          </el-form-item>
          <div class="form-actions">
            <el-button type="primary" @click="saveConfig">Save</el-button>
            <span v-if="hasUnsavedChanges" class="unsaved-indicator">Unsaved changes</span>
          </div>
        </el-form>
      </div>

      <!-- 右侧：内容选择 -->
      <div class="config-right">
        <div class="transfer-section">
          <div class="section-title">News Preview</div>
          <div class="transfer-wrapper">
            <el-transfer
              v-model="selectedNewsIds"
              :data="newsTransferData"
              :titles="['All News', 'Homepage']"
              filterable
              filter-placeholder="Search"
            />
            <div class="transfer-tip">Select 5 published news articles to display on the homepage.</div>
          </div>
        </div>

        <div class="transfer-section">
          <div class="section-title">Projects Preview</div>
          <div class="transfer-wrapper">
            <el-transfer
              v-model="selectedProjectIds"
              :data="projectsTransferData"
              :titles="['All Projects', 'Homepage']"
              filterable
              filter-placeholder="Search"
            />
            <div class="transfer-tip">Select 3 projects to display on the homepage.</div>
          </div>
        </div>
      </div>
    </div>

    <select-media-dialog
      v-model:visible="selectLogoDialogVisible"
      :media-type="MediaTypeEnum.LOGO"
      :current-media-url="globalConfigState.logoUrl"
      :show-upload-tab="true"
      @select="handleLogoSelect"
    />
  </div>
</template>

<style lang="less" scoped>
.global-config-container {
  height: calc(100vh - 120px);
  padding: 0 32px 32px;
  overflow: hidden;
  user-select: none;

  .section-title-skeleton {
    margin-bottom: 20px;
  }

  .form-item-skeleton {
    margin-bottom: 28px;
  }

  .transfer-skeleton {
    display: flex;
    align-items: center;
  }
}

.config-layout {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 48px;
  height: 100%;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--el-text-color-secondary);
  margin-bottom: 20px;
}

.config-left {
  display: flex;
  flex-direction: column;
  padding-top: 8px;

  .el-form {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  :deep(.el-form-item) {
    margin-bottom: 28px;

    .el-form-item__label {
      font-size: 14px;
      color: var(--el-text-color-regular);
      padding-bottom: 8px;
    }
  }

  .description-form-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    margin-bottom: 0 !important;

    :deep(.el-form-item__content) {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
  }

  .description-textarea {
    flex: 1;

    :deep(.el-textarea__inner) {
      height: 100% !important;
      min-height: 120px;
    }
  }
}

.logo-wrapper {
  display: flex;
  align-items: center;
  gap: 20px;

  .logo-preview {
    width: 80px;
    height: 80px;
    border-radius: 10px;
    border: 1px solid var(--el-border-color-lighter);
  }
}

.config-right {
  display: flex;
  flex-direction: column;
  gap: 32px;
  overflow-y: auto;
  padding: 8px 8px 8px 0;
}

.transfer-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.transfer-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;

  :deep(.el-transfer) {
    flex: 1;
    display: flex;
    align-items: stretch;

    .el-transfer-panel {
      flex: 1;
      max-width: 280px;
      min-height: 240px;
      max-height: 400px;
      height: auto;

      .el-transfer-panel__body {
        height: calc(100% - 40px);
        overflow: hidden;
      }

      .el-transfer-panel__list {
        max-height: 300px;
        overflow-y: auto;
      }
    }

    .el-transfer__buttons {
      padding: 0 16px;
    }
  }

  .transfer-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    flex-shrink: 0;
  }
}

.form-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: auto;
  padding-top: 16px;
}

.unsaved-indicator {
  color: #e6a23c;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;

  &::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    background-color: #e6a23c;
    border-radius: 50%;
  }
}
</style>
