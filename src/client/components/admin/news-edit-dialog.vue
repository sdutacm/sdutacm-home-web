<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { NewsItemVO } from '@common/modules/news/news.dto';
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
} from 'element-plus';
import { Upload, Image as IconPicture, Eye, SquarePen } from 'lucide-vue-next';
import { defineAsyncComponent } from 'vue';
import { MediaTypeEnum } from '@common/enums/media-type.enum';

// 动态导入 QuillEditor，避免在服务器端加载
const QuillEditor = defineAsyncComponent(() =>
  import('@vueup/vue-quill').then(module => module.QuillEditor)
);

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
    Upload,
    IconPicture,
    ElMessage,
    QuillEditor,
  },
})
export default class NewsEditDialog extends Vue {
  @Prop({ type: Boolean, default: false }) visible!: boolean;
  @Prop() closeDialog!: () => void;
  @Prop({ required: true }) newsId!: number;
  @Prop({ required: true }) newsForm!: NewsItemVO;
  @Prop({ required: true }) dialogType!: 'create' | 'edit';
  @Prop({ required: true }) fetchNewsList!: () => Promise<void>;

  // 存储选中的封面图片文件
  selectedCoverFile: File | null = null;

  async handleSubmmit() {
    if (this.dialogType === 'create') {
      await this.handleCreateNews(
        this.newsForm.title,
        this.newsForm.summary,
        this.newsForm.content,
        this.selectedCoverFile,
        this.newsForm.isPublished,
      );
    } else {
      await this.handleUpdateNews(
        this.newsId,
        this.newsForm.title,
        this.newsForm.summary,
        this.newsForm.content,
        this.selectedCoverFile,
        this.newsForm.isPublished,
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
  ) {
    try {
      let coverImagePath = '';

      // 如果有封面图片文件，先上传
      if (coverImageFile) {
        const uploadResult = await this.$api.uploadMedia({
          file: coverImageFile,
          type: MediaTypeEnum.IMAGE,
          alt: title, // 使用新闻标题作为图片alt
        });
        coverImagePath = uploadResult.path;
      }

      await this.$api.createNews({
        title,
        summary,
        content,
        coverImage: coverImagePath,
        isPublished,
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
  ) {
    try {
      let coverImagePath: string | undefined = undefined;
      if (coverImageFile) {
        const uploadResult = await this.$api.uploadMedia({
          file: coverImageFile,
          type: MediaTypeEnum.NEWS_COVER,
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
    this.newsForm.coverImage = URL.createObjectURL(file);
  }

  previewNews() {
    this.$router.push({ name: 'NewsPreviewView', params: { id: this.newsId } });
  }

  mounted() {
    console.log(this.newsForm);
  }
}
</script>

<template>
  <el-dialog :model-value="visible" width="80%" @close="closeDialog" align-center>
    <template #header="{ titleId, titleClass }">
      <h4 :id="titleId" :class="titleClass" style="display: flex; align-items: center; gap: 0.1rem">
        <el-icon><SquarePen /></el-icon>
        <span>{{ dialogTitle }}</span>
        <el-button @click="previewNews" circle size="small" style="margin-left: .3rem;" v-if="dialogType === 'edit'">
          <el-icon><Eye /></el-icon>
        </el-button>
      </h4>
    </template>
    <div class="dialog-content" :model="newsForm">
      <el-form label-width="auto" @submit.prevent="handleSubmmit">
        <el-form-item label="Cover Image">
          <label class="avatar-wrapper" @click="" for="coverImageInput">
            <input type="file" style="display: none" @change="handleFileChange" id="coverImageInput" />
            <el-image :src="newsForm.coverImage" style="height: 3rem" fit="cover">
              <template #error>
                <div class="image-viewer-slot image-slot">
                  <p>Click to upload</p>
                </div>
              </template>
            </el-image>
            <div class="avatar-overlay">
              <el-icon :size="24"><Upload /></el-icon>
            </div>
          </label>
        </el-form-item>
        <el-form-item label="Title">
          <el-input v-model="newsForm.title" />
        </el-form-item>
        <el-form-item label="Summary">
          <el-input v-model="newsForm.summary" />
        </el-form-item>
        <el-form-item label="Content">
          <div class="editor-container">
            <QuillEditor
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
            />
          </div>
        </el-form-item>
        <el-form-item label="isPublished">
          <el-switch v-model="newsForm.isPublished"></el-switch>
        </el-form-item>
        <el-form-item>
          <el-button @click="closeDialog">Cancel</el-button>
          <el-button type="primary" @click="handleSubmmit">{{ dialogType === 'create' ? 'Create' : 'Save' }}</el-button>
        </el-form-item>
      </el-form>
    </div>
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
