<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import { Sun, Moon } from 'lucide-vue-next';
import { effectiveTheme, toggleTheme } from '@client/utils/theme';

@Options({
  components: {
    Sun,
    Moon,
  },
})
export default class ThemeButton extends Vue {
  get isDark() {
    return effectiveTheme.value === 'dark';
  }

  handleToggle() {
    toggleTheme();
  }
}
</script>

<template>
  <div class="theme-button" @click="handleToggle">
    <client-only>
      <Moon v-if="isDark" :size="18" />
      <Sun v-else :size="18" />
    </client-only>
  </div>
</template>

<style scoped lang="less">
.theme-button {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  // background-color: var(--el-bg-color);
  color: var(--el-text-color);
  transition: background-color 0.3s, color 0.3s;

  &:hover {
    background-color: var(--el-bg-hover-color);
    color: var(--el-text-hover-color);
  }
}
</style>
