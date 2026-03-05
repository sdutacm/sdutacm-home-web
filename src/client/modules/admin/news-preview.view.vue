<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { View, RenderMethod, RenderMethodKind } from 'bwcx-client-vue3';
import { GetNewsDetailResDTO } from '@common/modules/news/news.dto';
import { ElButton, ElIcon } from 'element-plus';
import { Undo2 } from 'lucide-vue-next';
import NewsContainer from '@client/components/news-container.vue';

@View('/admin/news-preview/:id')
@RenderMethod(RenderMethodKind.CSR)
@Options({
  components: {
    NewsContainer,
    ElIcon,
    Undo2,
    ElButton,
  },
})
export default class NewsPreviewView extends Vue {
  id: number = 0;
  showLoading: boolean = true;
  newsInfo: GetNewsDetailResDTO = {
    id: 0,
    title: '',
    summary: '',
    content: '',
    coverImage: '',
    publishedAt: null,
    isPublished: false,
    createdAt: null,
    updatedAt: null,
    wxOfficialLink: '',
    updatedBy: {
      id: 0,
      username: '',
      avatar: '',
    },
  };
  private toNewsList() {
    this.$router.push({ name: 'NewsListContainer' });
  }

  async mounted() {
    this.id = parseInt(this.$route.params.id as string);
    console.log('NewsPreviewView mounted with id:', this.id);
    try {
      this.newsInfo = await this.$api.getNews({ id: this.id });
    } catch (error) {
      console.error('Failed to fetch news detail:', error);
    } finally {
      this.showLoading = false;
    }
  }
}
</script>
<template>
  <div class="return-button">
    <el-button @click="toNewsList" type="primary" style="margin: none">
      <el-icon><Undo2 /></el-icon>
      <span>To List</span>
    </el-button>
  </div>
  <news-container :newsInfo="newsInfo" :showLoading="showLoading" />
</template>

<style scoped lang="less">
.return-button {
  position: fixed;
  width: fit-content;
  height: fit-content;
  display: flex;
  justify-content: center;
  align-items: center;
  left: 1rem;
  top: 0.5rem;
  z-index: 10;
}
</style>
