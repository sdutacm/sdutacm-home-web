<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { GetGlobalConfigResDTO } from '@common/modules/global-config/global-config.dto';
import { Prop } from 'vue-property-decorator';
import { ElForm, ElInput, ElFormItem, ElImage, ElButton, ElMessage, ElLoading, ElTransfer } from 'element-plus';
import { View, ChildOf, RenderMethod, RenderMethodKind } from 'bwcx-client-vue3';

import SelectLogoDialog from '@client/components/admin/select-logo-dialog.vue';

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
    ElForm,
    ElInput,
    ElFormItem,
    ElImage,
    ElButton,
    ElMessage,
    SelectLogoDialog,
    ElTransfer,
  },
})
export default class GlobalConfigView extends Vue {
  globalConfigState: GetGlobalConfigResDTO | null = null;

  selectLogoDialogVisible = false;
  selectedLogoId: number | null = null;
  allNews: NewsItem[] = [];
  selectedNewsIds: number[] = [];
  allProjects: ProjectItem[] = [];
  selectedProjectIds: number[] = [];

  showSelectLogoDialog() {
    this.selectLogoDialogVisible = true;
  }

  handleLogoSelect(logo: any) {
    this.selectedLogoId = logo.id;
    this.globalConfigState.logoUrl = logo.path;
    ElMessage.success('Logo 已选择');
  }

  get newsTransferData(): TransferItem[] {
    // 只显示已发布的新闻
    return this.allNews
      .filter(news => news.isPublished)
      .map(news => ({
        key: news.id,
        label: news.title,
        disabled: false,
      }));
  }

  get projectsTransferData(): TransferItem[] {
    // 显示所有项目
    return this.allProjects.map(project => ({
      key: project.id,
      label: project.name,
      disabled: false,
    }));
  }

  async loadNewsList() {
    try {
      const res = await this.$api.getAllNews();
      this.allNews = res.rows;
    } catch (error) {
      console.error('加载新闻列表失败:', error);
    }
  }

  async loadProjectsList() {
    try {
      const res = await this.$api.getAllProjects();
      this.allProjects = res.rows;
    } catch (error) {
      console.error('加载项目列表失败:', error);
    }
  }

  async saveConfig() {
    if (this.selectedNewsIds.length !== 5) {
      ElMessage.warning('首页新闻预览必须选择恰好5条');
      return;
    }

    if (this.selectedProjectIds.length !== 3) {
      ElMessage.warning('首页项目预览必须选择恰好3个');
      return;
    }

    const loading = ElLoading.service({ fullscreen: true, text: '保存中...' });
    try {
      const updateData: any = {
        title: this.globalConfigState.title,
        slogan: this.globalConfigState.slogan,
        description: this.globalConfigState.description,
        homeNewsPreviewIds: this.selectedNewsIds,
        homeProjectsPreviewIds: this.selectedProjectIds,
      };

      if (this.selectedLogoId !== null) {
        updateData.logoId = this.selectedLogoId;
      }

      await this.$api.updateGlobalConfig(updateData);

      // 重新加载配置以获取最新数据
      const newConfig = await this.$api.getGlobalConfig();
      Object.assign(this.globalConfigState, newConfig);
      this.selectedNewsIds = newConfig.homeNewsPreviewIds || [];
      this.selectedProjectIds = newConfig.homeProjectsPreviewIds || [];

      ElMessage.success('配置保存成功');
      this.selectedLogoId = null;
    } catch (e) {
      console.error('保存全局配置失败:', e);
      ElMessage.error('配置保存失败，请重试');
    } finally {
      loading.close();
    }
  }

  async mounted() {
    this.globalConfigState = await this.$api.getGlobalConfig();
    await this.loadNewsList();
    await this.loadProjectsList();
    this.selectedNewsIds = this.globalConfigState?.homeNewsPreviewIds || [];
    this.selectedProjectIds = this.globalConfigState?.homeProjectsPreviewIds || [];
  }
}
</script>

<template>
  <div class="global-config-container">
    <el-form :model="globalConfigState" label-width="140px">
      <el-form-item label="logo">
        <el-image style="width: 100px; height: 100px" :src="globalConfigState.logoUrl" fit="contain" />
        <el-button size="small" style="margin-left: 10px" @click="showSelectLogoDialog">从资源库中选择 Logo</el-button>
      </el-form-item>
      <el-form-item label="title" required>
        <el-input v-model="globalConfigState.title" placeholder="请输入网站标题" class="inp"></el-input>
      </el-form-item>
      <el-form-item label="slogan" required>
        <el-input v-model="globalConfigState.slogan" class="inp"></el-input>
      </el-form-item>
      <el-form-item label="description" required>
        <el-input class="inp" type="textarea" v-model="globalConfigState.description" placeholder="请输入网站描述"></el-input>
      </el-form-item>
      <el-form-item label="首页新闻预览">
        <div class="transfer-wrapper">
          <el-transfer
            v-model="selectedNewsIds"
            :data="newsTransferData"
            :titles="['所有新闻', '首页展示 (必须5条)']"
            filterable
            filter-placeholder="搜索新闻"
          />
          <div class="transfer-tip">从左侧选择已发布的新闻，添加到右侧进行首页展示（必须恰好5条）</div>
        </div>
      </el-form-item>
      <el-form-item label="首页项目预览">
        <div class="transfer-wrapper">
          <el-transfer
            v-model="selectedProjectIds"
            :data="projectsTransferData"
            :titles="['所有项目', '首页展示 (必须3个)']"
            filterable
            filter-placeholder="搜索项目"
          />
          <div class="transfer-tip">从左侧选择项目，添加到右侧进行首页展示（必须恰好3个）</div>
        </div>
      </el-form-item>
      <el-button type="primary" size="large" @click="saveConfig">保存配置</el-button>
    </el-form>

    <select-logo-dialog
      v-model:visible="selectLogoDialogVisible"
      :current-logo-url="globalConfigState.logoUrl"
      @select="handleLogoSelect"
    />
  </div>
</template>

<style lang="less" scoped>
.global-config-container {
  padding: 20px;
}

.inp {
  width: 10rem;
}

.transfer-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;

  :deep(.el-transfer) {
    .el-transfer-panel {
      width: 280px;
    }
  }

  .transfer-tip {
    font-size: 12px;
    color: #999;
  }
}
</style>
