<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import {
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElImage,
  ElDescriptions,
  ElDescriptionsItem,
  ElMessage,
  ElLoading,
} from 'element-plus';
import { MediaDetailResDTO } from '@common/modules/media/media.dto';

@Options({
  components: {
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    ElButton,
    ElImage,
    ElDescriptions,
    ElDescriptionsItem,
  },
  directives: {
    loading: ElLoading.directive,
  },
})
export default class UpdateMediaDialog extends Vue {
  @Prop({ required: true })
  visible!: boolean;

  @Prop({ required: false, default: null })
  mediaId?: number | null;

  @Prop({ required: true })
  updateMediaList!: () => void;

  mediaDetail: MediaDetailResDTO | null = null;
  loading = false;
  formData = {
    alt: '',
  };

  @Watch('visible')
  async onVisibleChange(val: boolean) {
    if (val && this.mediaId) {
      await this.fetchMediaDetail();
    } else {
      this.mediaDetail = null;
      this.formData.alt = '';
    }
  }

  async fetchMediaDetail() {
    if (!this.mediaId) return;

    try {
      this.loading = true;
      this.mediaDetail = await this.$api.getMediaById({ id: this.mediaId });
      this.formData.alt = this.mediaDetail.alt || '';
    } catch (error) {
      console.error('获取媒体详情失败:', error);
      ElMessage.error('加载失败，请重试');
      this.handleClose();
    } finally {
      this.loading = false;
    }
  }

  async handleUpdate() {
    if (!this.mediaId) return;

    try {
      this.loading = true;
      await this.$api.updateMedia({
        id: this.mediaId,
        alt: this.formData.alt,
      });
      ElMessage.success('Updated successfully');
      this.updateMediaList();
      this.handleClose();
    } catch (error) {
      ElMessage.error('Update failed, please try again');
    } finally {
      this.loading = false;
    }
  }

  handleClose() {
    this.$emit('update:visible', false);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString('zh-CN');
  }
}
</script>

<template>
  <el-dialog :model-value="visible" title="Update Media" width="10rem" @close="handleClose">
    <div v-loading="loading" class="dialog-content">
      <div v-if="mediaDetail" class="media-detail">
        <div class="preview-section">
          <el-image style="width: 100px" :src="mediaDetail.path" fit="cover" class="preview-image" />
        </div>

        <el-descriptions :column="1" border>
          <el-descriptions-item label="Size">
            {{ formatFileSize(mediaDetail.size) }}
          </el-descriptions-item>
          <el-descriptions-item label="Created At">
            {{ formatDate(mediaDetail.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="Updated At">
            {{ formatDate(mediaDetail.updatedAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="Updated By">
            <div v-if="mediaDetail.uploadedBy" class="uploader-info">
              <el-image
                v-if="mediaDetail.uploadedBy.avatar"
                :src="mediaDetail.uploadedBy.avatar"
                class="uploader-avatar"
                fit="cover"
              />
              <span>{{ mediaDetail.uploadedBy.username }}</span>
            </div>
            <span v-else>Unknown</span>
          </el-descriptions-item>
        </el-descriptions>

        <el-form class="update-form" label-width="80px" @submit.prevent="handleUpdate">
          <el-form-item label="Description">
            <el-input v-model="formData.alt" placeholder="Enter image description" clearable />
          </el-form-item>
        </el-form>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose" :disabled="loading">Cancel</el-button>
      <el-button type="primary" @click="handleUpdate" :loading="loading">Save</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="less">
.dialog-content {
  min-height: 200px;
}

.media-detail {
  .preview-section {
    margin-bottom: 20px;
    text-align: center;

    // .preview-image {
    //   max-width: 100%;
    //   max-height: 300px;
    //   border-radius: 4px;
    //   border: 1px solid var(--el-border-color);
    // }
  }

  .uploader-info {
    display: flex;
    align-items: center;
    gap: 8px;

    .uploader-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
    }
  }

  .update-form {
    margin-top: 20px;
  }
}
</style>
