import { MediaTypeEnum } from '../enums/media-type.enum';

/**
 * 媒体类型配置
 */
export interface MediaTypeConfig {
  /** 允许的 MIME 类型列表 */
  mimeTypes: string[];
  /** 允许的文件扩展名列表（不含点号） */
  extensions: string[];
  /** 前端 accept 属性值 */
  accept: string;
  /** 类型描述 */
  label: string;
}

/**
 * 媒体类型配置映射
 */
export const MEDIA_TYPE_CONFIG: Record<MediaTypeEnum, MediaTypeConfig> = {
  [MediaTypeEnum.IMAGE]: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml'],
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'],
    accept: 'image/jpeg,image/png,image/gif,image/webp,image/avif,image/svg+xml',
    label: '图片',
  },
  [MediaTypeEnum.LOGO]: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml'],
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'],
    accept: 'image/jpeg,image/png,image/gif,image/webp,image/avif,image/svg+xml',
    label: 'Logo',
  },
  [MediaTypeEnum.AUDIO]: {
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac', 'audio/mp4'],
    extensions: ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'],
    accept: 'audio/mpeg,audio/wav,audio/ogg,audio/aac,audio/flac,audio/mp4',
    label: '音频',
  },
  [MediaTypeEnum.VIDEO]: {
    mimeTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'],
    extensions: ['mp4', 'webm', 'ogv', 'mov', 'avi'],
    accept: 'video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo',
    label: '视频',
  },
  [MediaTypeEnum.ADMIN_AVATAR]: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    accept: 'image/jpeg,image/png,image/gif,image/webp',
    label: '管理员头像',
  },
  [MediaTypeEnum.NEWS_COVER]: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'],
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'],
    accept: 'image/jpeg,image/png,image/gif,image/webp,image/avif',
    label: '新闻封面',
  },
  [MediaTypeEnum.PROJECT_COVER]: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'],
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'],
    accept: 'image/jpeg,image/png,image/gif,image/webp,image/avif',
    label: '项目封面',
  },
};

/**
 * 检查 MIME 类型是否被允许
 * @param mediaType 媒体类型枚举
 * @param mimeType 要检查的 MIME 类型
 * @returns 是否允许
 */
export function isAllowedMimeType(mediaType: MediaTypeEnum, mimeType: string): boolean {
  const config = MEDIA_TYPE_CONFIG[mediaType];
  if (!config) return false;
  return config.mimeTypes.includes(mimeType.toLowerCase());
}

/**
 * 检查文件扩展名是否被允许
 * @param mediaType 媒体类型枚举
 * @param extension 文件扩展名（可含或不含点号）
 * @returns 是否允许
 */
export function isAllowedExtension(mediaType: MediaTypeEnum, extension: string): boolean {
  const config = MEDIA_TYPE_CONFIG[mediaType];
  if (!config) return false;
  const ext = extension.toLowerCase().replace(/^\./, '');
  return config.extensions.includes(ext);
}

/**
 * 获取媒体类型的 accept 属性值
 * @param mediaType 媒体类型枚举
 * @returns accept 属性值
 */
export function getAcceptTypes(mediaType: MediaTypeEnum): string {
  const config = MEDIA_TYPE_CONFIG[mediaType];
  return config?.accept || '*/*';
}

/**
 * 获取媒体类型的标签
 * @param mediaType 媒体类型枚举
 * @returns 标签
 */
export function getMediaTypeLabel(mediaType: MediaTypeEnum): string {
  const config = MEDIA_TYPE_CONFIG[mediaType];
  return config?.label || '媒体';
}

/**
 * 根据文件名获取扩展名
 * @param filename 文件名
 * @returns 扩展名（不含点号）
 */
export function getExtensionFromFilename(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot + 1).toLowerCase();
}

/**
 * 验证文件是否符合媒体类型要求
 * @param mediaType 媒体类型枚举
 * @param mimeType MIME 类型
 * @param filename 文件名
 * @returns 验证结果
 */
export function validateMediaFile(
  mediaType: MediaTypeEnum,
  mimeType: string,
  filename: string
): { valid: boolean; error?: string } {
  const config = MEDIA_TYPE_CONFIG[mediaType];
  if (!config) {
    return { valid: false, error: `未知的媒体类型: ${mediaType}` };
  }

  // 检查 MIME 类型
  if (!isAllowedMimeType(mediaType, mimeType)) {
    return {
      valid: false,
      error: `不支持的文件类型: ${mimeType}。${config.label}仅支持: ${config.mimeTypes.join(', ')}`,
    };
  }

  // 检查扩展名
  const ext = getExtensionFromFilename(filename);
  if (ext && !isAllowedExtension(mediaType, ext)) {
    return {
      valid: false,
      error: `不支持的文件扩展名: .${ext}。${config.label}仅支持: ${config.extensions.map((e) => '.' + e).join(', ')}`,
    };
  }

  return { valid: true };
}
