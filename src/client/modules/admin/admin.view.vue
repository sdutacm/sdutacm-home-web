<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { View } from 'bwcx-client-vue3';
import { Prop } from 'vue-property-decorator';
import { RenderMethod, RenderMethodKind } from 'bwcx-client-vue3';
import AdminTools from '@client/components/admin/admin-tools.vue';
import { Head } from '@vueuse/head';

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
    currentPage: null,
  };

  adminPreviewRef = null;

  isCollapse: boolean = false;

  handleCloseCollapse() {
    this.isCollapse = !this.isCollapse;
    if (this.isCollapse) {
      this.adminPreviewRef?.classList.add('collapse-preview');
    } else {
      this.adminPreviewRef?.classList.remove('collapse-preview');
    }
  };

  async mounted() {
    const sess = await this.$api.getSession();
    this.adminState.userInfo = sess;
  }
}
</script>

<template>
  <Head>
    <title>SDUTACM Admin</title>
    <meta name="description" content="SDUTACM 管理后台" />
  </Head>

  <div class="admin-container">
    <div class="admin-tools">
      <AdminTools :userInfo="adminState.userInfo" :currentPage="adminState.currentPage" :isCollapsed="isCollapse" :handleCloseCollapse="handleCloseCollapse" />
    </div>
    <div class="admin-preview" ref="adminPreviewRef">
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </div>
  </div>
</template>

<style lang="less" scoped>
.admin-container {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: flex-start;
  align-items: stretch;

  & .admin-tools {
    width: fit-content;
    height: 100%;
    position: fixed;
    left: 0;
    z-index: 1000;
  }

  & .admin-preview {
    flex: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 20px;
    margin-left: 150px;
    overflow-x: auto;
    min-width: 0;
    transition: margin-left 0.3s ease;

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

.collapse-preview {
  margin-left: 80px !important;
}
</style>
