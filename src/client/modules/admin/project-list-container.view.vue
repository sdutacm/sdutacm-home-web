<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { View, ChildOf, RenderMethod, RenderMethodKind } from 'bwcx-client-vue3';
import { MediaTypeEnum } from '@common/enums/media-type.enum';

import {
  ElMessage,
  ElMessageBox,
  ElLoading,
  ElIcon,
  ElButton,
  ElTable,
  ElTableColumn,
  ElTag,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElSwitch,
  ElUpload,
  ElImage,
  ElColorPicker,
  ElPagination,
  ElSkeleton,
  ElSkeletonItem,
  vLoading,
} from 'element-plus';
import { Head } from '@vueuse/head';
import { Link, Edit, Trash2 as Delete, Upload } from 'lucide-vue-next';
import UserAvatar from '@client/components/user-avatar.vue';
import AddButton from '@client/components/admin/add-button.vue';
import TipButton from '@client/components/admin/tip-button.vue';

interface UpdatedAdmin {
  id: number;
  username: string;
  avatar?: string;
}

interface ProjectItem {
  id: number;
  name: string;
  description?: string;
  repoUrl?: string;
  websiteUrl?: string;
  coverImage?: string;
  bgColor?: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: UpdatedAdmin;
}

@View('/admin/project-list')
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
    AddButton,
    ElTableColumn,
    ElTag,
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    ElSwitch,
    ElUpload,
    ElImage,
    ElColorPicker,
    ElPagination,
    ElSkeleton,
    ElSkeletonItem,
    Edit,
    Delete,
    Upload,
    Link,
    Head,
    UserAvatar,
    TipButton,
  },
})
export default class ProjectListContainer extends Vue {
  projectList: ProjectItem[] = [];
  dialogVisible = false;
  dialogTitle = 'Add Project';
  isEdit = false;
  currentProjectId: number | null = null;
  loading: boolean = true;
  coverImageFile: any = null;
  uploadingCover = false;

  currentPage = 1;
  pageSize = 35;

  projectForm = {
    name: '',
    description: '',
    repoUrl: '',
    websiteUrl: '',
    coverImage: '',
    bgColor: '#f4f4f4',
  };

  async loadProjectList() {
    try {
      const res = await this.$api.getAllProjects({});
      this.projectList = res.rows;
    } catch (error) {
      console.error('加载项目列表失败:', error);
      ElMessage.error('加载项目列表失败');
    }
  }

  get paginatedProjectList() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.projectList.slice(start, end);
  }

  get totalProjects() {
    return this.projectList.length;
  }

  handlePageChange(page: number) {
    this.currentPage = page;
  }

  handleSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
  }

  handleCreate() {
    this.dialogTitle = 'Add Project';
    this.isEdit = false;
    this.currentProjectId = null;
    this.projectForm = {
      name: '',
      description: '',
      repoUrl: '',
      websiteUrl: '',
      coverImage: '',
      bgColor: '#f4f4f4',
    };
    this.coverImageFile = null;
    this.dialogVisible = true;
  }

  handleEdit(project: ProjectItem) {
    this.dialogTitle = 'Edit Project';
    this.isEdit = true;
    this.currentProjectId = project.id;
    this.projectForm = {
      name: project.name,
      description: project.description || '',
      repoUrl: project.repoUrl || '',
      websiteUrl: project.websiteUrl || '',
      coverImage: project.coverImage || '',
      bgColor: project.bgColor || '#f4f4f4',
    };
    this.coverImageFile = null;
    this.dialogVisible = true;
  }

  async handleDelete(project: ProjectItem) {
    try {
      await ElMessageBox.confirm(`Are you sure you want to delete the project "${project.name}"?`, 'Confirmation', {
        confirmButtonText: 'Yes',
        cancelButtonText: 'Cancel',
        type: 'warning',
      });

      await this.$api.deleteProject({ id: project.id });
      ElMessage.success('Deleted successfully');
      await this.loadProjectList();
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除项目失败:', error);
        ElMessage.error('Failed to delete project');
      }
    }
  }

  async handleSubmit() {
    if (!this.projectForm.name.trim()) {
      ElMessage.warning('Please enter project name');
      return;
    }

    const loading = ElLoading.service({ fullscreen: true, text: 'Saving...' });
    try {
      if (this.isEdit && this.currentProjectId) {
        await this.$api.updateProject({
          id: this.currentProjectId,
          ...this.projectForm,
        });
        ElMessage.success('Updated successfully');
      } else {
        await this.$api.createProject(this.projectForm);
        ElMessage.success('Created successfully');
      }
      this.dialogVisible = false;
      await this.loadProjectList();
    } catch (error) {
      console.error('Save project failed:', error);
      ElMessage.error('Failed to save project');
    } finally {
      loading.close();
    }
  }

  formatDate(date: Date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('zh-CN');
  }

  handleCoverImageChange(file: any) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      ElMessage.error('Image size must be less than 10MB');
      return false;
    }
    this.coverImageFile = file.raw;
    // 自动上传
    this.handleUploadCoverImage();
    return false;
  }

  async handleUploadCoverImage() {
    if (!this.coverImageFile) return;

    this.uploadingCover = true;
    try {
      const formData = new FormData();
      formData.append('file', this.coverImageFile);
      formData.append('type', MediaTypeEnum.PROJECT_COVER);
      formData.append('alt', `project-cover-${Date.now()}`);

      const response = await fetch('/api/uploadMedia', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('上传失败');
      }

      const result = await response.json();
      const coverPath = result.data.data.path;
      this.projectForm.coverImage = coverPath;
      this.coverImageFile = null;

      ElMessage.success('封面上传成功');
    } catch (error) {
      console.error('上传封面失败:', error);
      ElMessage.error('上传封面失败');
    } finally {
      this.uploadingCover = false;
    }
  }

  async mounted() {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      await this.loadProjectList();
    } finally {
      this.loading = false;
    }
  }
}
</script>

<template>
  <Head>
    <title>SDUTACM Admin | Project Management</title>
    <meta name="description" content="SDUTACM 管理后台项目管理" />
  </Head>

  <div class="project-list-container">
    <div class="toolbar">
      <add-button content="Project" @click="handleCreate"></add-button>
      <tip-button :content="['You can add, edit, or delete projects here. Click on the project name to view details on the website.', 'Please upload transparent PNG images whenever possible, and choose appropriate colors for the image.']" />
    </div>

    <div class="table-wrapper">
      <!-- 骨架屏 -->
      <div v-if="loading" class="table-skeleton">
        <el-skeleton :rows="0" animated>
        <template #template>
          <!-- 表头骨架 -->
          <div class="skeleton-table-header">
            <el-skeleton-item variant="text" style="width: 30px; height: 16px;" />
            <el-skeleton-item variant="text" style="width: 80px; height: 16px;" />
            <el-skeleton-item variant="text" style="width: 100px; height: 16px;" />
            <el-skeleton-item variant="text" style="width: 150px; height: 16px;" />
            <el-skeleton-item variant="text" style="width: 60px; height: 16px;" />
            <el-skeleton-item variant="text" style="width: 60px; height: 16px;" />
            <el-skeleton-item variant="text" style="width: 120px; height: 16px;" />
            <el-skeleton-item variant="text" style="width: 120px; height: 16px;" />
            <el-skeleton-item variant="text" style="width: 100px; height: 16px;" />
            <el-skeleton-item variant="text" style="width: 100px; height: 16px;" />
          </div>
          <!-- 表格行骨架 -->
          <div v-for="i in 12" :key="'skeleton-project-row-' + i" class="skeleton-table-row">
            <el-skeleton-item variant="text" style="width: 20px; height: 14px;" />
            <el-skeleton-item variant="rect" style="width: 60px; height: 40px; border-radius: 4px;" />
            <el-skeleton-item variant="text" style="width: 90px; height: 14px;" />
            <el-skeleton-item variant="text" style="width: 140px; height: 14px;" />
            <el-skeleton-item variant="text" style="width: 50px; height: 14px;" />
            <el-skeleton-item variant="text" style="width: 50px; height: 14px;" />
            <el-skeleton-item variant="text" style="width: 110px; height: 14px;" />
            <el-skeleton-item variant="text" style="width: 110px; height: 14px;" />
            <div style="display: flex; align-items: center; gap: 6px;">
              <el-skeleton-item variant="circle" style="width: 24px; height: 24px;" />
              <el-skeleton-item variant="text" style="width: 60px; height: 14px;" />
            </div>
            <div style="display: flex; gap: 8px;">
              <el-skeleton-item variant="text" style="width: 35px; height: 14px;" />
              <el-skeleton-item variant="text" style="width: 50px; height: 14px;" />
            </div>
          </div>
        </template>
        </el-skeleton>
      </div>
      <!-- 实际表格 -->
      <el-table v-else :data="paginatedProjectList" style="width: 100%; user-select: none;" stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column label="Cover Image" width="200">
        <template #default="{ row }">
          <el-image v-if="row.coverImage" :src="row.coverImage" style="width: 60px; height: 40px" fit="cover" />
          <span v-else style="color: #999">Null</span>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="Name" min-width="150" />
      <el-table-column prop="description" label="Description" min-width="200" show-overflow-tooltip />
      <el-table-column label="Repo" width="120">
        <template #default="{ row }">
          <a v-if="row.repoUrl" :href="row.repoUrl" target="_blank" style="color: #409eff">
            <el-icon><Link /></el-icon>
            <span> link </span>
          </a>
          <span v-else style="color: #999">-</span>
        </template>
      </el-table-column>
      <el-table-column label="Website" width="100">
        <template #default="{ row }">
          <a v-if="row.websiteUrl" :href="row.websiteUrl" target="_blank" style="color: #409eff">
            <el-icon><Link /></el-icon>
            <span> link </span>
          </a>
          <span v-else style="color: #999">-</span>
        </template>
      </el-table-column>
      <el-table-column label="CreatedAt" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="UpdatedAt" width="180">
        <template #default="{ row }">
          {{ formatDate(row.updatedAt) }}
        </template>
      </el-table-column>
      <el-table-column label="Updated By" width="150">
        <template #default="{ row }">
          <div v-if="row.updatedBy" class="editor-container">
            <user-avatar :avatarUrl="row.updatedBy.avatar" />
            <span>{{ row.updatedBy.username }}</span>
          </div>
          <div v-else>-</div>
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="150" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleEdit(row)" link>
            <el-icon><Edit /></el-icon>
            Edit
          </el-button>
          <el-button type="danger" size="small" @click="handleDelete(row)" link>
            <el-icon><Delete /></el-icon>
            Delete
          </el-button>
        </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页器骨架屏 -->
    <div v-if="loading" class="pagination-wrapper">
      <el-skeleton :rows="0" animated style="display: flex; gap: 8px; justify-content: center;">
        <template #template>
          <el-skeleton-item variant="text" style="width: 60px; height: 28px;" />
          <el-skeleton-item variant="button" style="width: 32px; height: 32px; border-radius: 4px;" />
          <el-skeleton-item variant="button" style="width: 32px; height: 32px; border-radius: 4px;" />
          <el-skeleton-item variant="button" style="width: 32px; height: 32px; border-radius: 4px;" />
          <el-skeleton-item variant="button" style="width: 32px; height: 32px; border-radius: 4px;" />
        </template>
      </el-skeleton>
    </div>
    <div class="pagination-wrapper" v-else>
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[35]"
        :total="totalProjects"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px">
      <template #header="{ titleId, titleClass }">
        <h4 :id="titleId" :class="titleClass" style="line-height: normal">Add Project</h4>
      </template>
      <el-form :model="projectForm" label-width="100px">
        <el-form-item label="Name" required>
          <el-input v-model="projectForm.name" />
        </el-form-item>
        <el-form-item label="Description">
          <el-input v-model="projectForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="Repo URL">
          <el-input v-model="projectForm.repoUrl" placeholder="https://github.com/..." />
        </el-form-item>
        <el-form-item label="Website URL">
          <el-input v-model="projectForm.websiteUrl" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="Cover Image">
          <div class="cover-upload-wrapper">
            <el-upload
              :show-file-list="false"
              :on-change="handleCoverImageChange"
              :auto-upload="false"
              accept="image/*"
              :disabled="uploadingCover"
            >
              <div class="cover-preview" v-loading="uploadingCover">
                <el-image
                  v-if="projectForm.coverImage"
                  :src="projectForm.coverImage"
                  style="width: 200px; height: 120px; cursor: pointer"
                  fit="cover"
                />
                <div v-else class="upload-placeholder">
                  <el-icon size="20"><Upload /></el-icon>
                  <div>Click to upload cover image</div>
                </div>
              </div>
            </el-upload>
            <div class="upload-tip">jpg/png files with a size less than 10MB.</div>
          </div>
        </el-form-item>
        <el-form-item label="卡片背景色">
          <div class="color-picker-wrapper">
            <el-color-picker v-model="projectForm.bgColor" show-alpha />
            <span class="color-value">{{ projectForm.bgColor }}</span>
            <div class="color-preview" :style="{ backgroundColor: projectForm.bgColor }"></div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="handleSubmit">Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="less" scoped>
.project-list-container {
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .pagination-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 12px 0;
    flex-shrink: 0;
  }

  .table-wrapper {
    flex: 1;
    overflow: auto;
    min-height: 0;
    margin-top: 16px;
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

  .cover-upload-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    .cover-preview {
      border: 1px dashed #dcdfe6;
      border-radius: 4px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: border-color 0.3s;

      &:hover {
        border-color: #409eff;
      }

      .upload-placeholder {
        width: 200px;
        height: 120px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #8c939d;
        font-size: 14px;
      }
    }

    .upload-tip {
      margin-top: 8px;
      font-size: 12px;
      color: #999;
    }
  }

  .color-picker-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;

    .color-value {
      font-family: monospace;
      font-size: 14px;
      color: #666;
    }

    .color-preview {
      width: 80px;
      height: 32px;
      border-radius: 4px;
      border: 1px solid #dcdfe6;
    }
  }

  .editor-container {
    display: flex;
    align-items: center;
    gap: 0.1rem;
  }
}
</style>
