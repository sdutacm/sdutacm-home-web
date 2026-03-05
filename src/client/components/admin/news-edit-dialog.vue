<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { NewsItemVO, NewsCategoryVO } from '@common/modules/news/news.dto';
import {
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElImage,
  ElUpload,
  ElAvatar,
  ElIcon,
  ElSwitch,
  ElMessage,
  ElSelect,
  ElOption,
  ElDatePicker,
} from 'element-plus';
import { Upload, Image as IconPicture, Eye, SquarePen } from 'lucide-vue-next';
import { defineAsyncComponent } from 'vue';
import { MediaTypeEnum } from '@common/enums/media-type.enum';
import SelectMediaDialog from './select-logo-dialog.vue';
import { resolveMediaUrl } from '@client/utils';

const QuillEditor = defineAsyncComponent(() => import('@vueup/vue-quill').then((module) => module.QuillEditor));

@Options({
  components: {
    SquarePen,
    Eye,
    ElSwitch,
    ElAvatar,
    ElImage,
    ElUpload,
    ElButton,
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    ElIcon,
    ElSelect,
    ElOption,
    ElDatePicker,
    Upload,
    IconPicture,
    ElMessage,
    QuillEditor,
    SelectMediaDialog,
  },
})
export default class NewsEditDialog extends Vue {
  // QuillEditor 实例引用
  quillEditorRef: any = null;

  resolveMediaUrl = resolveMediaUrl;

  // 图片选择对话框状态
  imageSelectDialogVisible = false;

  // 封面图片选择对话框状态
  coverSelectDialogVisible = false;

  // 暴露 MediaTypeEnum 给模板使用
  MediaTypeEnum = MediaTypeEnum;
  // 栏目列表
  categories: NewsCategoryVO[] = [];
  selectedCategoryId: number | null = null;
  categoryLoading = false;
  @Prop({ type: Boolean, default: false }) visible!: boolean;
  @Prop() closeDialog!: () => void;
  @Prop({ required: true }) newsId!: number;
  @Prop({ required: true }) newsForm!: NewsItemVO;
  @Prop({ required: true }) dialogType!: 'create' | 'edit';
  @Prop({ required: true }) fetchNewsList!: () => Promise<void>;

  // 存储选中的封面图片文件
  selectedCoverFile: File | null = null;

  // 存储从媒体库选择的封面图片路径
  selectedCoverPath: string | null = null;

  // 发布时间
  publishedAt: Date | string | null = null;

  @Watch('visible')
  onVisibleChange(newVal: boolean) {
    if (newVal) {
      this.loadCategories();
      // 如果是编辑模式，设置当前选中的栏目和发布时间
      if (this.dialogType === 'edit') {
        this.selectedCategoryId = this.newsForm.categoryId || null;
        this.publishedAt = this.newsForm.publishedAt ? new Date(this.newsForm.publishedAt) : null;
      } else {
        this.selectedCategoryId = null;
        // 创建模式默认使用当前时间
        this.publishedAt = new Date();
      }
    }
  }

  async loadCategories() {
    try {
      this.categoryLoading = true;
      const res = await this.$api.getAllCategories();
      this.categories = res.rows;
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      this.categoryLoading = false;
    }
  }

  async handleSubmmit() {
    if (this.dialogType === 'create') {
      await this.handleCreateNews(
        this.newsForm.title,
        this.newsForm.summary,
        this.newsForm.content,
        this.selectedCoverFile,
        this.newsForm.isPublished,
        this.selectedCategoryId,
        this.publishedAt,
        this.newsForm.wxOfficialLink,
      );
    } else {
      await this.handleUpdateNews(
        this.newsId,
        this.newsForm.title,
        this.newsForm.summary,
        this.newsForm.content,
        this.selectedCoverFile,
        this.newsForm.isPublished,
        this.selectedCategoryId,
        this.publishedAt,
        this.newsForm.wxOfficialLink,
      );
    }
    await this.fetchNewsList();
  }

  get dialogTitle() {
    return this.dialogType === 'edit' ? 'Edit News' : 'Create News';
  }

  async handleCreateNews(
    title: string,
    summary: string,
    content: string,
    coverImageFile: File | null,
    isPublished: boolean,
    categoryId: number | null,
    publishedAt: Date | string | null,
    wxOfficialLink?: string,
  ) {
    try {
      let coverImagePath = '';

      // 如果有选中的封面图片路径（从媒体库选择），直接使用
      if (this.selectedCoverPath) {
        coverImagePath = this.selectedCoverPath;
      } else if (coverImageFile) {
        // 如果有封面图片文件，先上传
        const uploadResult = await this.$api.uploadMedia({
          file: coverImageFile,
          type: MediaTypeEnum.IMAGE,
          alt: title,
        });
        coverImagePath = uploadResult.path;
      }

      await this.$api.createNews({
        title,
        summary,
        content,
        coverImage: coverImagePath,
        isPublished,
        categoryId: categoryId || undefined,
        publishedAt: publishedAt
          ? publishedAt instanceof Date
            ? publishedAt.toISOString()
            : new Date(publishedAt).toISOString()
          : undefined,
        wxOfficialLink: wxOfficialLink || undefined,
      });
      ElMessage.success('News created successfully');
      this.closeDialog();
    } catch (error) {
      console.error('Error creating news:', error);
      ElMessage.error('Failed to create news');
    }
  }

  async handleUpdateNews(
    id: number,
    title: string,
    summary: string,
    content: string,
    coverImageFile: File | null,
    isPublished: boolean,
    categoryId: number | null,
    publishedAt: Date | string | null,
    wxOfficialLink?: string,
  ) {
    try {
      let coverImagePath: string | undefined = undefined;

      // 如果有选中的封面图片路径（从媒体库选择），直接使用
      if (this.selectedCoverPath) {
        coverImagePath = this.selectedCoverPath;
      } else if (coverImageFile) {
        const uploadResult = await this.$api.uploadMedia({
          file: coverImageFile,
          type: MediaTypeEnum.IMAGE,
          alt: title,
        });
        coverImagePath = uploadResult.path;
      }

      await this.$api.updateNews({
        id,
        title,
        summary,
        content,
        coverImage: coverImagePath,
        isPublished,
        categoryId: categoryId ?? 0, // 0 表示移除栏目
        publishedAt: publishedAt
          ? publishedAt instanceof Date
            ? publishedAt.toISOString()
            : new Date(publishedAt).toISOString()
          : undefined,
        wxOfficialLink: wxOfficialLink || undefined,
      });
      ElMessage.success('News updated successfully');
      this.closeDialog();
    } catch (error) {
      console.error('Error updating news:', error);
      ElMessage.error('Failed to update news');
    }
  }

  async handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    this.selectedCoverFile = file;
    this.selectedCoverPath = null; // 清除媒体库选择
    this.newsForm.coverImage = URL.createObjectURL(file);
  }

  // 打开封面图片选择对话框
  openCoverSelectDialog() {
    this.coverSelectDialogVisible = true;
  }

  // 处理从媒体库选择的封面图片
  handleCoverSelect(media: any) {
    if (media && media.path) {
      this.newsForm.coverImage = media.path;
      this.selectedCoverPath = media.path;
      this.selectedCoverFile = null; // 清除本地文件选择
    }
  }

  previewNews() {
    this.$router.push({ name: 'NewsPreviewView', params: { id: this.newsId } });
  }

  // 处理图片上传到服务器
  async handleImageUpload(file: File): Promise<string | null> {
    try {
      const uploadResult = await this.$api.uploadMedia({
        file: file,
        type: MediaTypeEnum.IMAGE,
        alt: file.name,
      });
      return uploadResult.path;
    } catch (error) {
      console.error('Error uploading image:', error);
      ElMessage.error('Failed to upload image');
      return null;
    }
  }

  // 将图片插入到编辑器中
  insertImageToEditor(url: string) {
    const quill = this.quillEditorRef?.getQuill();
    if (quill) {
      const range = quill.getSelection(true);
      quill.insertEmbed(range.index, 'image', url);
      quill.setSelection(range.index + 1);
    }
  }

  // 自定义图片工具栏按钮处理器 - 打开图片选择对话框
  customImageHandler() {
    this.imageSelectDialogVisible = true;
  }

  // 处理从媒体库选择的图片
  handleImageSelect(media: any) {
    if (media && media.path) {
      this.insertImageToEditor(resolveMediaUrl(media.path));
    }
  }

  // 处理粘贴事件中的图片
  async handlePaste(event: ClipboardEvent) {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const items = clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        event.preventDefault();
        event.stopPropagation();

        const file = item.getAsFile();
        if (file) {
          const imageUrl = await this.handleImageUpload(file);
          if (imageUrl) {
            this.insertImageToEditor(imageUrl);
          }
        }
        break;
      }
    }
  }

  onEditorReady(quill: any) {
    const toolbar = quill.getModule('toolbar');
    if (toolbar) {
      toolbar.addHandler('image', () => this.customImageHandler());
    }

    quill.root.addEventListener('paste', (e: ClipboardEvent) => this.handlePaste(e), true);
  }

  mounted() {
    console.log(this.newsForm);
  }

  unmounted() {
    if (this.newsForm.coverImage && this.newsForm.coverImage.startsWith('blob:')) {
      URL.revokeObjectURL(this.newsForm.coverImage);
    }
    this.newsForm.content = '';
  }
}
</script>

<template>
  <el-dialog :model-value="visible" width="80%" @close="closeDialog" align-center class="news-edit-dialog">
    <template #header="{ titleId, titleClass }">
      <h4 :id="titleId" :class="titleClass" style="display: flex; align-items: center; gap: 0.1rem">
        <el-icon><SquarePen /></el-icon>
        <span>{{ dialogTitle }}</span>
        <el-button @click="previewNews" circle size="small" style="margin-left: 0.3rem" v-if="dialogType === 'edit'">
          <el-icon><Eye /></el-icon>
        </el-button>
      </h4>
    </template>
    <div class="dialog-content" :model="newsForm">
      <el-form label-width="auto" @submit.prevent="handleSubmmit">
        <el-form-item label="Cover Image">
          <div class="cover-upload-wrapper">
            <div class="avatar-wrapper" @click="openCoverSelectDialog">
              <el-image :src="resolveMediaUrl(newsForm.coverImage)" style="height: 3rem" fit="cover">
                <template #error>
                  <div class="image-viewer-slot image-slot">
                    <p>Click to select</p>
                  </div>
                </template>
              </el-image>
              <div class="avatar-overlay">
                <el-icon :size="24"><Upload /></el-icon>
              </div>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="Title">
          <el-input v-model="newsForm.title" />
        </el-form-item>
        <el-form-item label="Category">
          <el-select v-model="selectedCategoryId" clearable style="width: 100%" :loading="categoryLoading">
            <el-option v-for="category in categories" :key="category.id" :label="category.name" :value="category.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Summary">
          <el-input v-model="newsForm.summary" />
        </el-form-item>
        <el-form-item label="WeChat Official Link">
          <el-input v-model="newsForm.wxOfficialLink" placeholder="https://" />
        </el-form-item>
        <el-form-item label="Content">
          <div class="editor-container">
            <QuillEditor
              ref="quillEditorRef"
              v-model:content="newsForm.content"
              content-type="html"
              theme="snow"
              style="height: 10rem"
              :toolbar="[
                ['bold', 'italic', 'underline', 'strike'],
                [{ header: 1 }, { header: 2 }],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['link', 'image'],
                ['clean'],
              ]"
              @ready="onEditorReady"
            />
          </div>
        </el-form-item>
        <el-form-item label="isPublished">
          <el-switch v-model="newsForm.isPublished"></el-switch>
        </el-form-item>
        <el-form-item label="publishedAt">
          <el-date-picker
            v-model="publishedAt"
            type="datetime"
            placeholder="Select date and time"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item>
          <el-button @click="closeDialog">Cancel</el-button>
          <el-button type="primary" @click="handleSubmmit">{{ dialogType === 'create' ? 'Create' : 'Save' }}</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 图片选择对话框 -->
    <SelectMediaDialog
      v-model:visible="imageSelectDialogVisible"
      :media-type="MediaTypeEnum.IMAGE"
      :show-upload-tab="true"
      @select="handleImageSelect"
    />

    <!-- 封面图片选择对话框 -->
    <SelectMediaDialog
      v-model:visible="coverSelectDialogVisible"
      :media-type="MediaTypeEnum.IMAGE"
      :current-media-url="newsForm.coverImage"
      :show-upload-tab="true"
      @select="handleCoverSelect"
    />
  </el-dialog>
</template>

<style scoped lang="less">
.dialog-content {
  min-height: 200px;
}

.avatar-wrapper {
  position: relative;
  cursor: pointer;
  height: 3rem;
  flex-shrink: 0;

  &:hover .avatar-overlay {
    opacity: 1;
  }
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  color: white;
}

.editor-container {
  width: 100%;
}

.image-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  aspect-ratio: 1 / 1;
  color: #8c939d;
  border: 1px solid #dcdfe6;
}
</style>
