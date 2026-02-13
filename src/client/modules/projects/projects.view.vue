<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { View, RenderMethod, RenderMethodKind } from 'bwcx-client-vue3';

@View('/projects')
@RenderMethod(RenderMethodKind.CSR)
@Options({
  components: {
  },
})
export default class ProjectsView extends Vue {
}
</script>

<template>
  <div class="projects-view">
    <div class="projects-banner">
      
    </div>
  </div>
</template>

<style scoped lang="less">
.projects-view {
  position: relative;
  width: 100%;

  .projects-banner {
    width: 100%;
    height: 200px;
  }
}
</style>
