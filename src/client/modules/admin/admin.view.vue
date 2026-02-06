<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { View } from 'bwcx-client-vue3';
import { RenderMethod, RenderMethodKind } from 'bwcx-client-vue3';
import { AdminToolSectionEnum } from '@common/enums/admin-tool-section.enum';
import { MediaTypeEnum } from '@common/enums/media-type.enum';
import { GetMediaResDTO } from '@common/modules/media/media.dto';
import localforage from 'localforage';

import AdminTools from '@client/components/admin/admin-tools.vue';

@View('/admin')
@RenderMethod(RenderMethodKind.CSR)
@Options({
  components: {
    AdminTools,
  },
})
export default class AdminView extends Vue {
  adminState = {
    userInfo: null,
  };

  async mounted() {
    const sess = await this.$api.getSession();
    this.adminState.userInfo = sess;
    const lastPage = await localforage.getItem<any>('admin-last-page');
    console.log('Last admin page:', lastPage);
    if (lastPage) {
      if (lastPage.param) {
        this.$router.push({ name: lastPage.page, params: lastPage.param });
      } else {
        this.$router.push({ name: lastPage.page });
      }
    } else {
      this.$router.push({ name: 'OverviewView' });
    }
  }
}
</script>

<template>
  <div class="admin-container">
    <div class="admin-tools">
      <AdminTools :userInfo="adminState.userInfo" />
    </div>
    <div class="admin-preview">
      <router-view v-slot="{ Component }">
        <Suspense>
          <component :is="Component" />
        </Suspense>
      </router-view>
    </div>
  </div>
</template>

<style lang="less" scoped>
.admin-container {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;

  & .admin-tools {
    width: 300px;
    height: 100%;
  }

  & .admin-preview {
    flex: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 20px;

    .preview-header {
      h2 {
        margin: 0;
        font-size: 24px;
      }
    }

    .preview-content {
      flex: 1;
      overflow: auto;
    }
  }
}
</style>
