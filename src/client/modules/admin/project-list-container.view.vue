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
  vLoading,
} from 'element-plus';
import { Plus, Edit, Delete, Upload, Link } from '@element-plus/icons-vue';

interface ProjectItem {
  id: number;
  name: string;
  description?: string;
  repoUrl?: string;
  websiteUrl?: string;
  coverImage?: string;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
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
    ElTableColumn,
    ElTag,
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    ElSwitch,
    ElUpload,
    ElImage,
    Plus,
    Edit,
    Delete,
    Upload,
    Link,
  },
})
export default class ProjectListContainer extends Vue {
  projectList: ProjectItem[] = [];
  dialogVisible = false;
  dialogTitle = '创建项目';
  isEdit = false;
  currentProjectId: number | null = null;

  projectForm = {
    name: '',
    description: '',
    repoUrl: '',
    websiteUrl: '',
    coverImage: '',
    isFeatured: false,
  };

  coverImageFile: any = null;
  uploadingCover = false;

  async mounted() {
    await this.loadProjectList();
  }

  async loadProjectList() {
    try {
      const res = await this.$api.getAllProjects();
      this.projectList = res.rows;
    } catch (error) {
      console.error('加载项目列表失败:', error);
      ElMessage.error('加载项目列表失败');
    }
  }

  handleCreate() {
    this.dialogTitle = '创建项目';
    this.isEdit = false;
    this.currentProjectId = null;
    this.projectForm = {
      name: '',
      description: '',
      repoUrl: '',
      websiteUrl: '',
      coverImage: '',
      isFeatured: false,
    };
    this.coverImageFile = null;
    this.dialogVisible = true;
  }

  handleEdit(project: ProjectItem) {
    this.dialogTitle = '编辑项目';
    this.isEdit = true;
    this.currentProjectId = project.id;
    this.projectForm = {
      name: project.name,
      description: project.description || '',
      repoUrl: project.repoUrl || '',
      websiteUrl: project.websiteUrl || '',
      coverImage: project.coverImage || '',
      isFeatured: project.isFeatured,
    };
    this.coverImageFile = null;
    this.dialogVisible = true;
  }

  async handleDelete(project: ProjectItem) {
    try {
      await ElMessageBox.confirm(`确定要删除项目 "${project.name}" 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      });

      await this.$api.deleteProject({ id: project.id });
      ElMessage.success('删除成功');
      await this.loadProjectList();
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除项目失败:', error);
        ElMessage.error('删除项目失败');
      }
    }
  }

  async handleSubmit() {
    if (!this.projectForm.name.trim()) {
      ElMessage.warning('请输入项目名称');
      return;
    }

    const loading = ElLoading.service({ fullscreen: true, text: '保存中...' });
    try {
      if (this.isEdit && this.currentProjectId) {
        await this.$api.updateProject({
          id: this.currentProjectId,
          ...this.projectForm,
        });
        ElMessage.success('更新成功');
      } else {
        await this.$api.createProject(this.projectForm);
        ElMessage.success('创建成功');
      }
      this.dialogVisible = false;
      await this.loadProjectList();
    } catch (error) {
      console.error('保存项目失败:', error);
      ElMessage.error('保存项目失败');
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
      ElMessage.error('图片大小不能超过 10MB');
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
}
</script>

<template>
  <div class="project-list-container">
    <div class="toolbar">
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        创建项目
      </el-button>
    </div>

    <el-table :data="projectList" style="width: 100%; margin-top: 16px" stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column label="封面" width="100">
        <template #default="{ row }">
          <el-image v-if="row.coverImage" :src="row.coverImage" style="width: 60px; height: 40px" fit="cover" />
          <span v-else style="color: #999">暂无</span>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="项目名称" min-width="150" />
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column label="代码仓库" width="120">
        <template #default="{ row }">
          <a v-if="row.repoUrl" :href="row.repoUrl" target="_blank" style="color: #409eff">
            <el-icon><Link /></el-icon>
            查看
          </a>
          <span v-else style="color: #999">-</span>
        </template>
      </el-table-column>
      <el-table-column label="官网" width="100">
        <template #default="{ row }">
          <a v-if="row.websiteUrl" :href="row.websiteUrl" target="_blank" style="color: #409eff">
            <el-icon><Link /></el-icon>
            访问
          </a>
          <span v-else style="color: #999">-</span>
        </template>
      </el-table-column>
      <el-table-column label="首页展示" width="100">
        <template #default="{ row }">
          <el-tag :type="row.isFeatured ? 'success' : 'info'">
            {{ row.isFeatured ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleEdit(row)" link>
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button type="danger" size="small" @click="handleDelete(row)" link>
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px">
      <el-form :model="projectForm" label-width="100px">
        <el-form-item label="项目名称" required>
          <el-input v-model="projectForm.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目描述">
          <el-input v-model="projectForm.description" type="textarea" :rows="3" placeholder="请输入项目描述" />
        </el-form-item>
        <el-form-item label="代码仓库">
          <el-input v-model="projectForm.repoUrl" placeholder="https://github.com/..." />
        </el-form-item>
        <el-form-item label="项目官网">
          <el-input v-model="projectForm.websiteUrl" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="封面图片">
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
                  <el-icon :size="40"><Upload /></el-icon>
                  <div>点击上传封面</div>
                </div>
              </div>
            </el-upload>
            <div class="upload-tip">支持 jpg/png 格式，大小不超过 10MB</div>
          </div>
        </el-form-item>
        <el-form-item label="首页展示">
          <el-switch v-model="projectForm.isFeatured" active-text="是" inactive-text="否" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="less" scoped>
.project-list-container {
  padding: 16px;

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: flex-start;
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
}
</style>
