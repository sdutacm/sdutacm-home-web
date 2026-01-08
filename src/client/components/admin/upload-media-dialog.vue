<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { MediaTypeEnum } from '@common/enums/media-type.enum';
import { ElDialog, ElButton, ElUpload, ElInput, ElMessage, ElForm, ElFormItem, ElIcon } from 'element-plus';
import { Upload } from '@element-plus/icons-vue';

@Options({
  components: {
    ElDialog,
    ElButton,
    ElUpload,
    ElInput,
    ElForm,
    ElFormItem,
    Upload,
    ElIcon
  },
  emits: ['update:visible', 'upload-success'],
})
export default class UploadMediaDialog extends Vue {
  @Prop({ required: true, default: false })
  visible!: boolean;

  @Prop({ required: true })
  mediaType!: MediaTypeEnum;

  formData = {
    file: null as any,
    type: MediaTypeEnum.IMAGE,
    alt: '',
  };

  fileList: any[] = [];
  uploading = false;

  @Watch('visible')
  onVisibleChange(val: boolean) {
    if (val) {
      this.resetForm();
      this.formData.type = this.mediaType;
    }
  }

  @Watch('mediaType')
  onMediaTypeChange(val: MediaTypeEnum) {
    this.formData.type = val;
  }

  resetForm() {
    this.formData = {
      file: null,
      type: this.mediaType,
      alt: '',
    };
    this.fileList = [];
  }

  handleClose() {
    this.$emit('update:visible', false);
    this.resetForm();
  }

  handleFileChange(file: any) {
    this.formData.file = file.raw;
    return false; // 阻止自动上传
  }

  handleRemove() {
    this.formData.file = null;
    this.fileList = [];
  }

  async handleUpload() {
    if (!this.formData.file) {
      ElMessage.warning('请选择要上传的文件');
      return;
    }

    this.uploading = true;
    try {
      const formData = new FormData();
      formData.append('file', this.formData.file);
      formData.append('type', this.formData.type);
      if (this.formData.alt) {
        formData.append('alt', this.formData.alt);
      }

      // 使用原生 fetch 上传，因为需要发送 FormData
      const response = await fetch('/api/uploadMedia', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('上传失败');
      }

      const result = await response.json();
      ElMessage.success('上传成功');
      this.$emit('upload-success', result.data);
      this.handleClose();
    } catch (error: any) {
      console.error('上传失败:', error);
      ElMessage.error(error.message || '上传失败，请重试');
    } finally {
      this.uploading = false;
    }
  }

  get acceptTypes() {
    const typeMap: Record<MediaTypeEnum, string> = {
      [MediaTypeEnum.IMAGE]: 'image/*',
      [MediaTypeEnum.LOGO]: 'image/*',
      [MediaTypeEnum.AUDIO]: 'audio/*',
      [MediaTypeEnum.VIDEO]: 'video/*',
      [MediaTypeEnum.ADMIN_AVATAR]: 'image/*',
      [MediaTypeEnum.NEWS_COVER]: 'image/*',
    };
    return typeMap[this.mediaType] || '*';
  }

  get mediaTypeLabel() {
    const labelMap: Record<MediaTypeEnum, string> = {
      [MediaTypeEnum.IMAGE]: '图片',
      [MediaTypeEnum.LOGO]: 'Logo',
      [MediaTypeEnum.AUDIO]: '音频',
      [MediaTypeEnum.VIDEO]: '视频',
      [MediaTypeEnum.ADMIN_AVATAR]: '管理员头像',
      [MediaTypeEnum.NEWS_COVER]: '新闻封面',
    };
    return labelMap[this.mediaType] || '媒体';
  }
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="`上传${mediaTypeLabel}`"
    width="500px"
    @close="handleClose"
  >
    <el-form :model="formData" label-width="80px">
      <el-form-item label="文件">
        <el-upload
          v-model:file-list="fileList"
          :accept="acceptTypes"
          :auto-upload="false"
          :limit="1"
          :on-change="handleFileChange"
          :on-remove="handleRemove"
          drag
        >
          <el-icon class="el-icon--upload"><upload /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              请上传{{ mediaTypeLabel }}文件
            </div>
          </template>
        </el-upload>
      </el-form-item>

      <el-form-item label="描述">
        <el-input
          v-model="formData.alt"
          type="textarea"
          :rows="3"
          placeholder="请输入描述信息（可选）"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          :loading="uploading"
          :disabled="!formData.file"
          @click="handleUpload"
        >
          {{ uploading ? '上传中...' : '确认上传' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped lang="less">
.el-icon--upload {
  font-size: 67px;
  color: #8c939d;
  margin: 40px 0 16px;
}

.el-upload__text {
  font-size: 14px;
  text-align: center;

  em {
    color: #409eff;
    font-style: normal;
  }
}

.el-upload__tip {
  font-size: 12px;
  margin-top: 7px;
}
</style>
