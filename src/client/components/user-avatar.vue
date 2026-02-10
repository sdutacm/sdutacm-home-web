<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { ElAvatar } from 'element-plus';

@Options({
  components: {
    ElAvatar,
  },
})
export default class UserAvatar extends Vue {
  @Prop({
    type: String,
    required: false,
    default: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
  })
  avatarUrl!: string;
  @Prop({ default: 'small'}) size!: 'large' | 'medium' | 'small';
}
</script>

<template>
  <el-avatar :src="avatarUrl" :size="size" />
</template>
