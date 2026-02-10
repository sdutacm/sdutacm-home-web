<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { View, ChildOf, RenderMethod, RenderMethodKind } from 'bwcx-client-vue3';
import { NewsItemVO } from '@common/modules/news/news.dto';

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
import { Plus, Edit, Delete, View as ViewIcon, Upload } from '@element-plus/icons-vue';
import NewsEditDialog from '@client/components/admin/news-edit-dialog.vue';
import UserAvatar from '@client/components/user-avatar.vue';

@View('/admin/news-list')
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
    ElSelect,
    ElOption,
    Plus,
    Edit,
    Delete,
    ViewIcon,
    Upload,
    NewsEditDialog,
    UserAvatar,
  },
})
export default class NewsListContainer extends Vue {
  newsList: NewsItemVO[] = [];
  dialogVisible = false;
  dialogType: 'create' | 'edit' = 'create';
  isEdit = false;
  currentNewsId: number | null = null;
  filterStatus = 'all'; // 筛选状态: 'all', 'published', 'draft'

  newsForm = {
    title: '',
    summary: '',
    content: '',
    coverImage: '',
    updatedBy: null,
    isPublished: false,
  };

  coverImageFile: any = null;
  uploadingCover = false;

  get filteredNewsList() {
    if (this.filterStatus === 'all') return this.newsList;
    if (this.filterStatus === 'published') return this.newsList.filter((n) => n.isPublished);
    if (this.filterStatus === 'draft') return this.newsList.filter((n) => !n.isPublished);
    return this.newsList;
  }

  async mounted() {
    await this.loadNewsList();
  }

  async loadNewsList() {
    try {
      const res = await this.$api.getAllNews();
      this.newsList = res.rows;
      console.log('新闻列表:', { ...this.newsList });
    } catch (error) {
      console.error('加载新闻列表失败:', error);
      ElMessage.error('加载新闻列表失败');
    }
  }

  showCreateDialog() {
    this.dialogType = 'create';
    this.isEdit = false;
    this.currentNewsId = null;
    this.newsForm = {
      title: '',
      summary: '',
      content: '',
      coverImage: '',
      isPublished: false,
      updatedBy: null,
    };
    this.coverImageFile = null;
    this.dialogVisible = true;
  }

  showEditDialog(news: NewsItemVO) {
    this.dialogType = 'edit';
    this.isEdit = true;
    this.currentNewsId = news.id;
    this.newsForm = {
      title: news.title,
      summary: news.summary || '',
      content: news.content,
      coverImage: news.coverImage || '',
      updatedBy: news.updatedBy || null,
      isPublished: news.isPublished,
    };
    this.coverImageFile = null;
    this.dialogVisible = true;
  }

  async handleDelete(news: NewsItemVO) {
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

  formatDate(date: Date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('zh-CN');
  }
}
</script>

<template>
  <div class="news-list-container">
    <div class="toolbar">
      <el-button type="primary" @click="showCreateDialog">
        <el-icon><Plus /></el-icon>
        创建新闻
      </el-button>
      <el-select v-model="filterStatus" placeholder="筛选状态" style="width: 120px; margin-left: 12px">
        <el-option label="全部" value="all" />
        <el-option label="已发布" value="published" />
        <el-option label="草稿" value="draft" />
      </el-select>
    </div>

    <el-table :data="filteredNewsList" style="width: max-content; margin-top: 16px" stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
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
      <el-table-column label="更新时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.updatedAt) }}
        </template>
      </el-table-column>
      <el-table-column label="更新人" width="100">
        <template #default="{ row }">
          <div v-if="row.updatedBy" class="editor-container">
            <user-avatar :avatarUrl="row.updatedBy.avatar" />
            <span>{{ row.updatedBy.username }}</span>
          </div>
          <div v-else>-</div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="showEditDialog(row)" link>
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

    <!-- 编辑新闻对话框 -->
    <news-edit-dialog
      :visible="dialogVisible"
      :closeDialog="
        () => {
          dialogVisible = false;
        }
      "
      :newsForm="newsForm"
      :newsId="currentNewsId"
      :dialogType="dialogType"
      :fetchNewsList="loadNewsList"
    />
  </div>
</template>

<style lang="less" scoped>
.news-list-container {
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: start;
  overflow-x: auto;

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

.editor-container {
  display: flex;
  align-items: center;
  gap: .1rem;
}
</style>
