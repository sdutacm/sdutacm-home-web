<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { View } from 'bwcx-client-vue3';
import { RenderMethod, RenderMethodKind } from 'bwcx-client-vue3';

@View('/admin')
@RenderMethod(RenderMethodKind.CSR)
@Options({})
export default class AdminView extends Vue {}
</script>

<template>
<div class="admin-container">
  <div class="admin-tools"></div>
  <div class="admin-preview"></div>
</div>
</template>

<style lang="less" scoped>
.admin-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  & .admin-tools {
    width: 200px;
    height: 100%;
    background-color: #f0f0f0;
  }

  & .admin-preview {
    flex: 1;
    height: 100%;
    background-color: #ffffff;
  }
}
</style>
