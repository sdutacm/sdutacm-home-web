<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { ElIcon, ElButton } from 'element-plus';
import { Plus } from 'lucide-vue-next';

@Options({
  components: {
    ElIcon,
    ElButton,
    Plus,
  },
})
export default class AddButton extends Vue {
  @Prop({ default: 'Item' }) content: string;
}
</script>

<template>
  <el-button plain style="padding: 0 1rem" round>
    <el-icon>
      <Plus />
    </el-icon>
    <span>{{ content }}</span>
  </el-button>
</template>
