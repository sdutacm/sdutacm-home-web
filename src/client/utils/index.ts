/**
 * 防抖函数：在一定时间内多次触发同一事件，只执行最后一次
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
) {
  let timeout: ReturnType<typeof setTimeout> | undefined

  return function (
    this: ThisParameterType<T>,
    ...args: Parameters<T>
  ) {
    if (timeout) clearTimeout(timeout)

    timeout = setTimeout(() => {
      func.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数：在一定时间内只执行一次函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
) {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function (
    this: ThisParameterType<T>,
    ...args: Parameters<T>
  ) {
    if (!timeout) {
      timeout = setTimeout(() => {
        func.apply(this, args)
        timeout = null
      }, delay)
    }
  }
}

/**
 * 解析媒体资源 URL
 * - 如果 path 已经是完整 URL（COS CDN），直接返回
 * - 如果是相对路径，拼上当前 origin
 */
export function resolveMediaUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${window.location.origin}${path}`;
}
