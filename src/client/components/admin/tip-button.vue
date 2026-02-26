<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { ElButton, ElIcon, ElDialog } from 'element-plus';
import { CircleQuestionMark } from 'lucide-vue-next';

@Options({
  components: {
    ElButton,
    ElDialog,
    ElIcon,
    CircleQuestionMark,
  },
})
export default class TipButton extends Vue {
  showDialog: boolean = false;
  @Prop({ required: true }) content: string[] = [];
}
</script>

<template>
  <el-icon size="20" @click="showDialog = true" style="cursor: pointer;"><circle-question-mark /></el-icon>

  <el-dialog v-model="showDialog" title="Tips" width="500px">
    <template #header="{ titleId, titleClass }">
      <h4 :id="titleId" :class="titleClass" style="line-height: normal">Tips</h4>
    </template>
    <p v-for="(item, index) in content" :key="index">
      <span>{{ index + 1 }}. </span>
      <span>{{ item }}</span>
    </p>
    <template #footer>
      <el-button @click="showDialog = false">Got it</el-button>
    </template>
  </el-dialog>
</template>
