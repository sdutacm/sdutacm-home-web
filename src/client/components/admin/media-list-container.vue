<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { MediaTypeEnum } from '@common/enums/media-type.enum';
import { GetMediaResDTO } from '@common/modules/media/media.dto';

import { ElButton, ElImage, ElUpload, ElCard, ElIcon, ElMessage, ElMessageBox, ElEmpty } from 'element-plus';
import { Delete, Edit } from '@element-plus/icons-vue';
import UploadMediaDialog from './upload-media-dialog.vue';

@Options({
  components: {
    ElButton,
    ElImage,
    ElUpload,
    ElCard,
    ElIcon,
    ElEmpty,
    Delete,
    UploadMediaDialog,
    Edit
  },
  emits: ['refresh'],
})
export default class MediaListContainer extends Vue {
  @Prop({ required: true })
  mediaType!: MediaTypeEnum;

  @Prop({ required: true })
  mediaList!: GetMediaResDTO;

  uploadDialogVisible = false;

  showUploadDialog() {
    this.uploadDialogVisible = true;
  }

  async handleUploadSuccess(media: any) {
    this.$emit('refresh');
  }

  async handleDelete(media: any) {
    try {
      await ElMessageBox.confirm(`确定要删除这个${this.mediaType}吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      });

      await this.$api.deleteMedia({ id: media.id });
      ElMessage.success('删除成功');
      this.$emit('refresh');
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除失败:', error);
        ElMessage.error('删除失败，请重试');
      }
    }
  }
}
</script>

<template>
  <div class="media-list-container">
    <header class="media-list-header">
      <el-button type="primary" size="small" @click="showUploadDialog"> 上传 {{ mediaType }} </el-button>
    </header>
    <main class="media-list-main">
      <div v-if="mediaList.rows.length === 0" class="media-list-fallback">
        <el-empty :description="`暂无 ${mediaType} 资源，请先上传`" />
      </div>
      <el-card
        v-else
        v-for="media in mediaList.rows"
        :key="media.id"
        :body-style="{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }"
        class="media-list-card"
      >
        <div class="media-list-image-container">
          <el-image :src="media.path" class="media-list-card-image" fit="contain" />
        </div>
        <template #footer>
          <div  class="media-list-card-alt">
            {{ media.alt ? media.alt : '无描述' }}
          </div>
          <footer class="media-list-card-footer">
            <el-button circle >
              <el-icon><edit /></el-icon>
            </el-button>
            <el-button type="danger" circle @click="handleDelete(media)" plain>
              <el-icon><delete /></el-icon>
            </el-button>
          </footer>
        </template>
      </el-card>
    </main>

    <upload-media-dialog
      v-model:visible="uploadDialogVisible"
      :media-type="mediaType"
      @upload-success="handleUploadSuccess"
    />
  </div>
</template>

<style scoped lang="less">
.media-list-container {
  display: flex;
  flex-direction: column;
  height: 100%;


  .media-list-main {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: .5rem;
    overflow-y: auto;
  }

  .media-list-card {
    width: 250px;
    aspect-ratio: 1 / 1.2;
    display: flex;
    flex-direction: column;
    border-radius: 0.1rem;
    overflow: hidden;

    .media-list-image-container {
      height: 100%;
      aspect-ratio: 1;
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;

      & .media-list-card-image {
        display: block;
        height: 90%;
      }
    }

    .media-list-card-alt {
      padding: 8px;
      font-size: 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: center;
      white-space: nowrap;
    }

    & .media-list-card-footer {
      padding: 10px;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-top: auto;
    }
  }

  .media-list-fallback {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #999;
    font-size: 14px;
  }
}
</style>
