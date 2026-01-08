<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { ElEmpty, ElButton } from 'element-plus';
import { RenderMethod, RenderMethodKind } from 'bwcx-client-vue3';

@RenderMethod(RenderMethodKind.SSR)
@Options({
  components: {
    ElEmpty,
    ElButton,
  }
})
export default class NotFoundView extends Vue {
  goHome() {
    return this.$router.push('/');
  }
}
</script>

<template>
  <Head>
    <title>页面不存在</title>
  </Head>
  <div class="not-found">
    <el-empty description="404 Not Found">
      <el-button type="primary" plain @click="goHome">Go Home</el-button>
    </el-empty>
  </div>
</template>

<style scoped lang="less">
.not-found {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
