<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Watch } from 'vue-property-decorator';
import { View, ChildOf, RenderMethod, RenderMethodKind } from 'bwcx-client-vue3';
import { NewsItemVO, NewsCategoryVO } from '@common/modules/news/news.dto';

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
  ElPagination,
  ElSkeleton,
  ElSkeletonItem,
  ElPopover,
  ElScrollbar,
  vLoading,
  ClickOutside,
} from 'element-plus';
import { Head } from '@vueuse/head';
import { Edit, Trash2 as Delete, Plus, Check, X } from 'lucide-vue-next';
import NewsEditDialog from '@client/components/admin/news-edit-dialog.vue';
import UserAvatar from '@client/components/user-avatar.vue';
import AddButton from '@client/components/admin/add-button.vue';
import TipButton from '@client/components/admin/tip-button.vue';

@View('/admin/news-list')
@ChildOf('AdminView')
@RenderMethod(RenderMethodKind.CSR)
@Options({
  directives: {
    loading: vLoading,
    clickOutside: ClickOutside,
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
    Head,
    ElSelect,
    ElOption,
    ElPagination,
    ElSkeleton,
    ElSkeletonItem,
    ElPopover,
    ElScrollbar,
    Edit,
    Delete,
    NewsEditDialog,
    UserAvatar,
    TipButton,
    Plus,
    Check,
    X,
  },
})
export default class NewsListContainer extends Vue {
  newsList: NewsItemVO[] = [];
  dialogVisible = false;
  dialogType: 'create' | 'edit' = 'create';
  isEdit = false;
  currentNewsId: number | null = null;
  filterStatus = 'all'; // 筛选状态: 'all', 'published', 'draft'
  loading: boolean = true;

  // 分页相关
  currentPage = 1;
  pageSize = 25;

  // 栏目管理相关
  categories: NewsCategoryVO[] = [];
  categoryInputValue = '';
  showCategoryDropdown = false;
  editingCategoryId: number | null = null;
  editingCategoryName = '';
  categoryLoading = false;
  filterCategoryId: number | null = null; // 栏目筛选

  newsForm = {
    title: '',
    summary: '',
    content: '',
    coverImage: '',
    updatedBy: null,
    isPublished: false,
    categoryId: null as number | null,
  };

  coverImageFile: any = null;
  uploadingCover = false;

  get filteredNewsList() {
    let list = this.newsList;

    // 栏目筛选
    if (this.filterCategoryId !== null) {
      list = list.filter((n) => n.categoryId === this.filterCategoryId);
    }

    // 发布状态筛选
    if (this.filterStatus === 'published') {
      list = list.filter((n) => n.isPublished);
    } else if (this.filterStatus === 'draft') {
      list = list.filter((n) => !n.isPublished);
    }

    return list;
  }

  get paginatedNewsList() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredNewsList.slice(start, end);
  }

  get totalNews() {
    return this.filteredNewsList.length;
  }

  handlePageChange(page: number) {
    this.currentPage = page;
  }

  handleSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
  }

  @Watch('filterStatus')
  onFilterStatusChange() {
    this.currentPage = 1;
  }

  @Watch('filterCategoryId')
  onFilterCategoryIdChange() {
    this.currentPage = 1;
  }

  async loadNewsList() {
    try {
      const res = await this.$api.getAllNews({});
      this.newsList = res.rows;
      console.log('新闻列表:', { ...this.newsList });
    } catch (error) {
      console.error('Failed to load news list:', error);
      ElMessage.error('Failed to load news list');
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
      categoryId: null,
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
      categoryId: news.categoryId || null,
    };
    this.coverImageFile = null;
    this.dialogVisible = true;
  }

  async handleDelete(news: NewsItemVO) {
    try {
      await ElMessageBox.confirm(`Are you sure you want to delete the news "${news.title}"?`, 'Confirmation', {
        confirmButtonText: 'Yes',
        cancelButtonText: 'Cancel',
        type: 'warning',
      });

      await this.$api.deleteNews({ id: news.id });
      ElMessage.success('Deleted successfully');
      await this.loadNewsList();
    } catch (error) {
      if (error !== 'cancel') {
        console.error('Failed to delete news:', error);
        ElMessage.error('Failed to delete news');
      }
    }
  }

  formatDate(date: Date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('zh-CN');
  }

  resetForm() {
    this.newsForm = {
      title: '',
      summary: '',
      content: '',
      coverImage: '',
      updatedBy: null,
      isPublished: false,
      categoryId: null,
    };
    this.coverImageFile = null;
  }

  // ==================== 栏目管理方法 ====================

  async loadCategories() {
    try {
      this.categoryLoading = true;
      const res = await this.$api.getAllCategories();
      this.categories = res.rows;
    } catch (error) {
      console.error('Failed to load categories:', error);
      ElMessage.error('加载栏目列表失败');
    } finally {
      this.categoryLoading = false;
    }
  }

  handleCategoryInputFocus() {
    this.showCategoryDropdown = true;
    // 每次 focus 时重新加载栏目列表
    this.loadCategories();
  }

  handleCategoryDropdownClose() {
    this.showCategoryDropdown = false;
    this.editingCategoryId = null;
    this.editingCategoryName = '';
  }

  // 点击栏目进行筛选
  handleCategoryClick(category: NewsCategoryVO) {
    // 如果点击的是当前已选中的栏目，则取消筛选
    if (this.filterCategoryId === category.id) {
      this.filterCategoryId = null;
    } else {
      this.filterCategoryId = category.id;
    }
    this.showCategoryDropdown = false;
  }

  // 清除栏目筛选
  clearCategoryFilter() {
    this.filterCategoryId = null;
  }

  // 获取当前筛选的栏目名称
  get filterCategoryName() {
    if (this.filterCategoryId === null) return null;
    const category = this.categories.find((c) => c.id === this.filterCategoryId);
    return category?.name || null;
  }

  async handleCategoryInputEnter() {
    const name = this.categoryInputValue.trim();
    if (!name) return;

    // 检查是否已存在同名栏目
    if (this.categories.some((c) => c.name === name)) {
      ElMessage.warning('该栏目名称已存在');
      return;
    }

    try {
      await this.$api.createCategory({ name });
      ElMessage.success('栏目创建成功');
      this.categoryInputValue = '';
      await this.loadCategories();
    } catch (error) {
      console.error('Failed to create category:', error);
      ElMessage.error('创建栏目失败');
    }
  }

  startEditCategory(category: NewsCategoryVO) {
    this.editingCategoryId = category.id;
    this.editingCategoryName = category.name;
  }

  cancelEditCategory() {
    this.editingCategoryId = null;
    this.editingCategoryName = '';
  }

  async saveEditCategory() {
    if (!this.editingCategoryId) return;
    const name = this.editingCategoryName.trim();
    if (!name) {
      ElMessage.warning('栏目名称不能为空');
      return;
    }

    // 检查是否已存在同名栏目（排除当前编辑的栏目）
    if (this.categories.some((c) => c.name === name && c.id !== this.editingCategoryId)) {
      ElMessage.warning('该栏目名称已存在');
      return;
    }

    try {
      await this.$api.updateCategory({ id: this.editingCategoryId, name });
      ElMessage.success('栏目更新成功');
      this.editingCategoryId = null;
      this.editingCategoryName = '';
      await this.loadCategories();
    } catch (error) {
      console.error('Failed to update category:', error);
      ElMessage.error('更新栏目失败');
    }
  }

  async handleDeleteCategory(category: NewsCategoryVO) {
    try {
      await ElMessageBox.confirm(
        `确定要删除栏目「${category.name}」吗？该栏目下的新闻将不再属于任何栏目。`,
        '确认删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        },
      );

      await this.$api.deleteCategory({ id: category.id });
      ElMessage.success('栏目删除成功');
      await this.loadCategories();
    } catch (error) {
      if (error !== 'cancel') {
        console.error('Failed to delete category:', error);
        ElMessage.error('删除栏目失败');
      }
    }
  }

  async mounted() {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 模拟加载延迟
      await this.loadNewsList();
    } finally {
      this.loading = false;
    }
  }
}
</script>

<template>
  <Head>
    <title>SDUTACM Admin | News Management</title>
    <meta name="description" content="SDUTACM 管理后台新闻管理" />
  </Head>

  <div class="news-list-container">
    <div class="toolbar">
      <add-button content="News" @click="showCreateDialog"></add-button>
      <div style="display: flex; align-items: center; gap: 0.2rem">
        <!-- 栏目筛选标签 -->
        <el-tag v-if="filterCategoryName" closable type="primary" @close="clearCategoryFilter" style="margin-left: 8px">
          栏目: {{ filterCategoryName }}
        </el-tag>
        <!-- 栏目管理输入框 -->
        <div class="category-manager" v-click-outside="handleCategoryDropdownClose">
          <el-input
            v-model="categoryInputValue"
            placeholder="输入栏目名称并回车创建"
            style="width: 220px"
            @focus="handleCategoryInputFocus"
            @keyup.enter="handleCategoryInputEnter"
            clearable
          >
            <template #prefix>
              <el-icon><Plus /></el-icon>
            </template>
          </el-input>
          <!-- 栏目列表下拉面板 -->
          <div v-show="showCategoryDropdown" class="category-dropdown">
            <!-- <div class="category-dropdown-header">
              <span>栏目管理</span>
              <span class="category-count">共 {{ categories.length }} 个栏目</span>
            </div> -->
            <el-scrollbar max-height="300px">
              <div v-if="categoryLoading" class="category-loading">
                <el-skeleton :rows="3" animated />
              </div>
              <div v-else-if="categories.length === 0" class="category-empty">暂无栏目，请输入名称并回车创建</div>
              <div v-else class="category-list">
                <div
                  v-for="category in categories"
                  :key="category.id"
                  class="category-item"
                  :class="{ 'is-active': filterCategoryId === category.id }"
                >
                  <!-- 编辑模式 -->
                  <template v-if="editingCategoryId === category.id">
                    <el-input
                      v-model="editingCategoryName"
                      size="small"
                      style="flex: 1"
                      @keyup.enter="saveEditCategory"
                      @keyup.escape="cancelEditCategory"
                      autofocus
                    />
                    <div class="category-item-actions">
                      <el-button type="success" size="small" link @click="saveEditCategory">
                        <el-icon><Check /></el-icon>
                      </el-button>
                      <el-button type="info" size="small" link @click="cancelEditCategory">
                        <el-icon><X /></el-icon>
                      </el-button>
                    </div>
                  </template>
                  <!-- 展示模式 -->
                  <template v-else>
                    <div class="category-item-info" @click="handleCategoryClick(category)">
                      <span class="category-name">{{ category.name }}</span>
                      <span class="category-news-count">{{ category.newsCount || 0 }} 篇新闻</span>
                    </div>
                    <div class="category-item-actions">
                      <el-button type="primary" size="small" link @click.stop="startEditCategory(category)">
                        <el-icon><Edit /></el-icon>
                      </el-button>
                      <el-button type="danger" size="small" link @click.stop="handleDeleteCategory(category)">
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                  </template>
                </div>
              </div>
            </el-scrollbar>
          </div>
        </div>

        <el-select v-model="filterStatus" placeholder="Select State" style="width: 120px; margin-left: 12px">
          <el-option label="All" value="all" />
          <el-option label="Published" value="published" />
          <el-option label="Draft" value="draft" />
        </el-select>
        <tip-button
          :content="[
            'Filter news by status: All, Published, or Draft.',
            'Click 「Add News」 to create a new news item.',
            'Use the Edit and Delete buttons to manage existing news items.',
            '在栏目管理输入框中输入名称并回车可快速创建栏目。',
            '点击栏目名称可筛选该栏目下的新闻。',
          ]"
        ></tip-button>
      </div>
    </div>

    <div class="table-wrapper">
      <!-- 骨架屏 -->
      <div v-if="loading" class="table-skeleton">
        <el-skeleton :rows="0" animated>
          <template #template>
            <!-- 表头骨架 -->
            <div class="skeleton-table-header">
              <el-skeleton-item variant="text" style="width: 40px; height: 16px" />
              <el-skeleton-item variant="text" style="width: 150px; height: 16px" />
              <el-skeleton-item variant="text" style="width: 100px; height: 16px" />
              <el-skeleton-item variant="text" style="width: 70px; height: 16px" />
              <el-skeleton-item variant="text" style="width: 120px; height: 16px" />
              <el-skeleton-item variant="text" style="width: 120px; height: 16px" />
              <el-skeleton-item variant="text" style="width: 120px; height: 16px" />
              <el-skeleton-item variant="text" style="width: 100px; height: 16px" />
              <el-skeleton-item variant="text" style="width: 100px; height: 16px" />
            </div>
            <!-- 表格行骨架 -->
            <div v-for="i in 10" :key="'skeleton-row-' + i" class="skeleton-table-row">
              <el-skeleton-item variant="text" style="width: 30px; height: 14px" />
              <el-skeleton-item variant="text" style="width: 140px; height: 14px" />
              <el-skeleton-item variant="text" style="width: 90px; height: 14px" />
              <el-skeleton-item variant="button" style="width: 60px; height: 22px; border-radius: 4px" />
              <el-skeleton-item variant="text" style="width: 110px; height: 14px" />
              <el-skeleton-item variant="text" style="width: 110px; height: 14px" />
              <el-skeleton-item variant="text" style="width: 110px; height: 14px" />
              <div style="display: flex; align-items: center; gap: 6px">
                <el-skeleton-item variant="circle" style="width: 24px; height: 24px" />
                <el-skeleton-item variant="text" style="width: 60px; height: 14px" />
              </div>
              <div style="display: flex; gap: 8px">
                <el-skeleton-item variant="text" style="width: 40px; height: 14px" />
                <el-skeleton-item variant="text" style="width: 50px; height: 14px" />
              </div>
            </div>
          </template>
        </el-skeleton>
      </div>
      <!-- 实际表格 -->
      <el-table v-else :data="paginatedNewsList" style="width: 100%; user-select: none" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="Title" min-width="200" show-overflow-tooltip />
        <el-table-column prop="summary" label="Summary" min-width="150" show-overflow-tooltip />
        <el-table-column label="Status" width="120">
          <template #default="{ row }">
            <el-tag :type="row.isPublished ? 'success' : 'info'">
              {{ row.isPublished ? 'Published' : 'Draft' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="PublishedAt" width="180">
          <template #default="{ row }">
            {{ formatDate(row.publishedAt) }}
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
        <el-table-column label="Operate" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="showEditDialog(row)" link>
              <el-icon><Edit /></el-icon>
              <span>Edit</span>
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)" link>
              <el-icon><Delete /></el-icon>
              <span>Delete</span>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页器骨架屏 -->
    <div v-if="loading" class="pagination-wrapper">
      <el-skeleton :rows="0" animated style="display: flex; gap: 8px; justify-content: center">
        <template #template>
          <el-skeleton-item variant="text" style="width: 60px; height: 28px" />
          <el-skeleton-item variant="button" style="width: 32px; height: 32px; border-radius: 4px" />
          <el-skeleton-item variant="button" style="width: 32px; height: 32px; border-radius: 4px" />
          <el-skeleton-item variant="button" style="width: 32px; height: 32px; border-radius: 4px" />
          <el-skeleton-item variant="button" style="width: 32px; height: 32px; border-radius: 4px" />
        </template>
      </el-skeleton>
    </div>
    <div class="pagination-wrapper" v-else>
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[25]"
        :total="totalNews"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <news-edit-dialog
      :visible="dialogVisible"
      :closeDialog="
        () => {
          dialogVisible = false;
          resetForm();
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
  height: 100%;
  overflow: hidden;

  .toolbar {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  // 栏目管理样式
  .category-manager {
    display: flex;
    position: relative;

    .category-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      width: 320px;
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color-light);
      border-radius: 8px;
      box-shadow: var(--el-box-shadow-light);
      z-index: 1000;

      .category-dropdown-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        // padding: 12px 16px;
        border-bottom: 1px solid var(--el-border-color-lighter);
        font-weight: 500;

        .category-count {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          font-weight: normal;
        }
      }

      .category-loading,
      .category-empty {
        padding: 24px 16px;
        text-align: center;
        color: var(--el-text-color-secondary);
        font-size: 14px;
      }

      .category-list {
        padding: 8px 0;

        .category-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          gap: 8px;
          transition: background-color 0.2s;

          &:hover {
            background-color: var(--el-fill-color-light);
          }

          &.is-active {
            background-color: var(--el-color-primary-light-9);
            border-left: 3px solid var(--el-color-primary);
            padding-left: 13px;
          }

          .category-item-info {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-width: 0;
            cursor: pointer;

            .category-name {
              font-size: 14px;
              color: var(--el-text-color-primary);
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .category-news-count {
              font-size: 12px;
              color: var(--el-text-color-secondary);
            }
          }

          .category-item-actions {
            display: flex;
            gap: 4px;
            flex-shrink: 0;
          }
        }
      }
    }
  }

  .pagination-wrapper {
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
}

.editor-container {
  display: flex;
  align-items: center;
  gap: 0.1rem;
}

.loading-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
}
</style>
