<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { NewsItemVO } from '@common/modules/news/news.dto';
import { ElDialog, ElForm, ElFormItem, ElInput } from 'element-plus';

@Options({
  components: {
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
  },
})
export default class NewsEditDialog extends Vue {
  @Prop({ type: Boolean, default: false }) visible!: boolean;
  @Prop() closeDialog!: () => void;
  @Prop({required: true}) newsForm!: NewsItemVO;
}
</script>

<template>
  <el-dialog :model-value="visible" width="90%" @close="closeDialog" title="Edit News">
    <div class="dialog-content">
      <el-form>
        <el-form-item label="Title">
          <el-input v-model="newsForm.title" />
        </el-form-item>
        <el-form-item label="Summary">
          <el-input v-model="newsForm.summary" />
        </el-form-item>
        <el-form-item label="Content">
        </el-form-item>

      </el-form>
    </div>
  </el-dialog>
</template>

<style scoped lang="less">
.dialog-content {
  min-height: 200px;
}
</style>
