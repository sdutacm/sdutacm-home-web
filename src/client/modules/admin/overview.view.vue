<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { View, ChildOf, RenderMethod, RenderMethodKind } from 'bwcx-client-vue3';

@View('/admin/overview')
@ChildOf('AdminView')
@RenderMethod(RenderMethodKind.CSR)
@Options({})
export default class OverviewView extends Vue {}
</script>

<template>
  <div>OverviewView</div>
</template>
