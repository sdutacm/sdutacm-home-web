import { ref } from 'vue';

export type Theme = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'theme-preference';

// 响应式的当前主题状态
export const currentTheme = ref<Theme>('system');
// 响应式的实际显示主题（light 或 dark）
export const effectiveTheme = ref<'light' | 'dark'>('light');

/**
 * 获取系统主题偏好
 */
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * 从 localStorage 读取保存的主题偏好
 */
function getSavedTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    return saved;
  }
  return null;
}

/**
 * 保存主题偏好到 localStorage
 */
function saveTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

/**
 * 应用主题到 DOM
 */
function applyThemeToDOM(theme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  html.classList.remove('light', 'dark');
  html.classList.add(theme);
  effectiveTheme.value = theme;
}

/**
 * 计算并应用实际主题
 */
function updateEffectiveTheme(): void {
  const theme = currentTheme.value;
  const effective = theme === 'system' ? getSystemTheme() : theme;
  applyThemeToDOM(effective);
}

/**
 * 设置主题
 * @param theme - 'light' | 'dark' | 'system'
 */
export function setTheme(theme: Theme): void {
  currentTheme.value = theme;
  saveTheme(theme);
  updateEffectiveTheme();
}

/**
 * 切换主题（在 light 和 dark 之间切换）
 */
export function toggleTheme(): void {
  const newTheme = effectiveTheme.value === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

/**
 * 初始化主题系统
 * 优先使用用户保存的偏好，否则跟随系统主题
 */
export function initTheme(): void {
  if (typeof window === 'undefined') return;

  // 读取保存的主题偏好
  const savedTheme = getSavedTheme();
  currentTheme.value = savedTheme || 'system';

  // 应用主题
  updateEffectiveTheme();

  // 监听系统主题变化（仅在 system 模式下生效）
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    if (currentTheme.value === 'system') {
      updateEffectiveTheme();
    }
  });
}
