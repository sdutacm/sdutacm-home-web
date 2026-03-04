import { Service } from 'bwcx-ljsm';
import COS from 'cos-nodejs-sdk-v5';
import { MediaTypeEnum } from '@common/enums/media-type.enum';
import * as path from 'path';

/**
 * 根据 MediaType 映射 COS 上的子目录
 */
function getMediaSubDir(type: MediaTypeEnum): string {
  switch (type) {
    case MediaTypeEnum.LOGO:
      return 'logo';
    case MediaTypeEnum.IMAGE:
      return 'image';
    case MediaTypeEnum.ADMIN_AVATAR:
      return 'admin-avatar';
    case MediaTypeEnum.NEWS_COVER:
      return 'news-cover';
    case MediaTypeEnum.PROJECT_COVER:
      return 'project-cover';
    default:
      return type;
  }
}

@Service()
export default class CosService {
  private cos: COS;
  private bucket: string;
  private region: string;
  private cdnBaseUrl: string;

  public constructor() {
    const secretId = process.env.COS_SECRET_ID;
    const secretKey = process.env.COS_SECRET_KEY;
    const bucket = process.env.COS_BUCKET;
    const region = process.env.COS_REGION;
    const cdnBaseUrl = process.env.COS_CDN_BASE_URL;

    if (!secretId || !secretKey || !bucket || !region || !cdnBaseUrl) {
      console.warn(
        '[CosService] 缺少 COS 环境变量配置 (COS_SECRET_ID, COS_SECRET_KEY, COS_BUCKET, COS_REGION, COS_CDN_BASE_URL)，COS 上传功能将不可用',
      );
    }

    this.bucket = bucket || '';
    this.region = region || '';
    this.cdnBaseUrl = (cdnBaseUrl || '').replace(/\/+$/, ''); // 去除尾部斜杠

    this.cos = new COS({
      SecretId: secretId,
      SecretKey: secretKey,
    });
  }

  /**
   * 检查 COS 服务是否可用
   */
  isAvailable(): boolean {
    return !!(this.bucket && this.region && this.cdnBaseUrl);
  }

  /**
   * 上传文件到 COS
   * @param buffer 文件内容
   * @param filename 文件名（如 1.png）
   * @param type 媒体类型
   * @param onProgress 可选的进度回调，参数 percent 范围 0-1
   * @returns CDN URL
   */
  async upload(
    buffer: Buffer,
    filename: string,
    type: MediaTypeEnum,
    onProgress?: (percent: number) => void,
  ): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('COS 服务未配置，无法上传');
    }

    const subDir = getMediaSubDir(type);
    const key = `assets/${subDir}/${filename}`;

    await new Promise<COS.PutObjectResult>((resolve, reject) => {
      this.cos.putObject(
        {
          Bucket: this.bucket,
          Region: this.region,
          Key: key,
          Body: buffer,
          onProgress: onProgress
            ? (progressData) => {
                onProgress(progressData.percent);
              }
            : undefined,
        },
        (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        },
      );
    });

    return `${this.cdnBaseUrl}/${key}`;
  }

  /**
   * 从 COS 删除文件
   * @param cosUrl CDN URL 或 COS key
   */
  async delete(cosUrl: string): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    let key = cosUrl;
    // 如果传入的是完整 CDN URL，提取 key
    if (cosUrl.startsWith('http://') || cosUrl.startsWith('https://')) {
      const url = new URL(cosUrl);
      key = url.pathname.replace(/^\//, '');
    }
    // 如果是以 /assets/ 开头的相对路径
    if (key.startsWith('/')) {
      key = key.slice(1);
    }

    await new Promise<COS.DeleteObjectResult>((resolve, reject) => {
      this.cos.deleteObject(
        {
          Bucket: this.bucket,
          Region: this.region,
          Key: key,
        },
        (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        },
      );
    });
  }
}
