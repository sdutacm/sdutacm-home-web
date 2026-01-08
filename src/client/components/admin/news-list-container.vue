<script lang="ts">
import { Vue, Options } from 'vue-class-component';
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
  ElSelect,
  ElOption,
  vLoading,
} from 'element-plus';
import { Plus, Edit, Delete, View, Upload } from '@element-plus/icons-vue';
import { MediaTypeEnum } from '@common/enums/media-type.enum';

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  content: string;
  coverImage: string;
  isPublished: boolean;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

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
    ElSelect,
    ElOption,
    Plus,
    Edit,
    Delete,
    View,
    Upload,
  },
})
export default class NewsListContainer extends Vue {
  newsList: NewsItem[] = [];
  dialogVisible = false;
  dialogTitle = '创建新闻';
  isEdit = false;
  currentNewsId: number | null = null;
  filterStatus = 'all'; // 筛选状态: 'all', 'published', 'draft'

  newsForm = {
    title: '',
    summary: '',
    content: '',
    coverImage: '',
    isPublished: false,
  };

  coverImageFile: any = null;
  uploadingCover = false;

  get filteredNewsList() {
    if (this.filterStatus === 'all') return this.newsList;
    if (this.filterStatus === 'published') return this.newsList.filter(n => n.isPublished);
    if (this.filterStatus === 'draft') return this.newsList.filter(n => !n.isPublished);
    return this.newsList;
  }

  async mounted() {
    await this.loadNewsList();
  }

  async loadNewsList() {
    try {
      const res = await this.$api.getAllNews();
      this.newsList = res.rows;
    } catch (error) {
      console.error('加载新闻列表失败:', error);
      ElMessage.error('加载新闻列表失败');
    }
  }

  handleCreate() {
    this.dialogTitle = '创建新闻';
    this.isEdit = false;
    this.currentNewsId = null;
    this.newsForm = {
      title: '',
      summary: '',
      content: '',
      coverImage: '',
      isPublished: false,
    };
    this.coverImageFile = null;
    this.dialogVisible = true;
  }

  handleEdit(news: NewsItem) {
    this.dialogTitle = '编辑新闻';
    this.isEdit = true;
    this.currentNewsId = news.id;
    this.newsForm = {
      title: news.title,
      summary: news.summary || '',
      content: news.content,
      coverImage: news.coverImage || '',
      isPublished: news.isPublished,
    };
    this.coverImageFile = null;
    this.dialogVisible = true;
  }

  async handleDelete(news: NewsItem) {
    try {
      await ElMessageBox.confirm(`确定要删除新闻 "${news.title}" 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      });

      await this.$api.deleteNews({ id: news.id });
      ElMessage.success('删除成功');
      await this.loadNewsList();
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除新闻失败:', error);
        ElMessage.error('删除新闻失败');
      }
    }
  }

  async handleSubmit() {
    if (!this.newsForm.title.trim()) {
      ElMessage.warning('请输入新闻标题');
      return;
    }
    if (!this.newsForm.content.trim()) {
      ElMessage.warning('请输入新闻内容');
      return;
    }

    const loading = ElLoading.service({ fullscreen: true, text: '保存中...' });
    try {
      if (this.isEdit && this.currentNewsId) {
        await this.$api.updateNews({
          id: this.currentNewsId,
          ...this.newsForm,
        });
        ElMessage.success('更新成功');
      } else {
        await this.$api.createNews(this.newsForm);
        ElMessage.success('创建成功');
      }
      this.dialogVisible = false;
      await this.loadNewsList();
    } catch (error) {
      console.error('保存新闻失败:', error);
      ElMessage.error('保存新闻失败');
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
      formData.append('type', MediaTypeEnum.NEWS_COVER);
      formData.append('alt', `news-cover-${Date.now()}`);

      const response = await fetch('/api/uploadMedia', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('上传失败');
      }

      const result = await response.json();
      const coverPath = result.data.data.path;
      this.newsForm.coverImage = coverPath;
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
  <div class="news-list-container">
    <div class="toolbar">
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        创建新闻
      </el-button>
      <el-select v-model="filterStatus" placeholder="筛选状态" style="width: 120px; margin-left: 12px">
        <el-option label="全部" value="all" />
        <el-option label="已发布" value="published" />
        <el-option label="草稿" value="draft" />
      </el-select>
    </div>

    <el-table :data="filteredNewsList" style="width: 100%; margin-top: 16px" stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="title" label="标题" min-width="200" />
      <el-table-column prop="summary" label="摘要" min-width="150" show-overflow-tooltip />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.isPublished ? 'success' : 'info'">
            {{ row.isPublished ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发布时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.publishedAt) }}
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px">
      <el-form :model="newsForm" label-width="100px">
        <el-form-item label="标题" required>
          <el-input v-model="newsForm.title" placeholder="请输入新闻标题" />
        </el-form-item>
        <el-form-item label="摘要">
          <el-input
            v-model="newsForm.summary"
            type="textarea"
            :rows="2"
            placeholder="请输入新闻摘要"
          />
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input
            v-model="newsForm.content"
            type="textarea"
            :rows="10"
            placeholder="请输入新闻内容（之后会集成富文本编辑器）"
          />
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
                  v-if="newsForm.coverImage"
                  :src="newsForm.coverImage"
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
        <el-form-item label="发布状态">
          <el-switch v-model="newsForm.isPublished" active-text="已发布" inactive-text="草稿" />
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
.news-list-container {
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
