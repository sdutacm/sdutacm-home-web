<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { View } from 'bwcx-client-vue3';
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
      <AdminTools :userInfo="adminState.userInfo" :currentPage="adminState.currentPage" />
    </div>
    <div class="admin-preview">
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
    width: 300px;
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
    margin-left: 300px;
    overflow-x: auto;
    min-width: 0;

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
