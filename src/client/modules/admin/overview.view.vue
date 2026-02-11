<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { View, ChildOf, RenderMethod, RenderMethodKind } from 'bwcx-client-vue3';
import { Head } from '@vueuse/head';

@View('/admin/overview')
@ChildOf('AdminView')
@RenderMethod(RenderMethodKind.CSR)
@Options({
  components: {
    Head,
  },
})
export default class OverviewView extends Vue {}
</script>

<template>
  <Head>
    <title>SDUTACM Admin | Overview</title>
    <meta name="description" content="SDUTACM 管理后台概览">
  </Head>
  <div>OverviewView</div>
</template>
