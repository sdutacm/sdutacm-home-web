import { Service, InjectCtx, RequestContext } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import { MediaTypeEnum } from '@common/enums/media-type.enum';
import {
  GetMediaListReqDTO,
  GetMediaListResDTO,
  UploadMediaReqDTO,
  MediaDetailResDTO,
  InitChunkUploadReqDTO,
  InitChunkUploadResDTO,
  UploadChunkReqDTO,
  UploadChunkResDTO,
  CompleteChunkUploadReqDTO,
  CompleteChunkUploadResDTO,
} from '@common/modules/media/media.dto';
import { validateMediaFile, getMediaTypeConfig } from '@common/config/media-type-config';
import appDataSource from '@server/db';
import { Media } from '@server/db/entity/media';
import AuditService from '@server/modules/audit/audit.service';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// 分片上传状态存储
interface ChunkUploadState {
  uploadId: string;
  filename: string;
  fileSize: number;
  type: MediaTypeEnum;
  alt?: string;
  totalChunks: number;
  receivedChunks: Set<number>;
  tempDir: string;
  createdAt: Date;
  admin: any; // 保存上传时的管理员信息
}

// 内存存储分片上传状态（生产环境可考虑使用 Redis）
const chunkUploadStates = new Map<string, ChunkUploadState>();

// 分片大小: 2MB
const CHUNK_SIZE = 2 * 1024 * 1024;

@Service()
export default class MediaService {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
    @Inject()
    private readonly auditService: AuditService,
  ) {}

  async getMediaList(type: MediaTypeEnum, page: number = 1, pageSize: number = 20): Promise<GetMediaListResDTO> {
    try {
      const mediaRepo = appDataSource.getRepository(Media);
      const [list, total] = await mediaRepo.findAndCount({
        where: {
          type: type,
        },
        relations: ['updatedBy'], // 加载关联的管理员信息
        skip: (page - 1) * pageSize,
        take: pageSize,
        order: {
          createdAt: 'DESC',
        },
      });

      // 映射数据，转换 updatedBy 为前端需要的格式
      const rows = list.map((media) => ({
        id: media.id,
        path: media.path,
        type: media.type,
        alt: media.alt,
        size: media.size,
        active: media.active,
        createdAt: media.createdAt,
        updatedAt: media.updatedAt,
        updatedBy: media.updatedBy
          ? {
              id: media.updatedBy.id,
              username: media.updatedBy.username,
              avatar: media.updatedBy.avatar,
            }
          : undefined,
      }));

      return { rows, total };
    } catch (error) {
      console.error('Error fetching media list:', error);
      throw error;
    }
  }

  async uploadMedia(data: UploadMediaReqDTO): Promise<MediaDetailResDTO> {
    const { file, type, alt } = data;
    console.log('Received file for upload:', file);

    // 验证文件类型
    const validation = validateMediaFile(type, file.mimetype, file.originalname);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    const typeDir = path.join(publicDir, type);
    if (!fs.existsSync(typeDir)) {
      fs.mkdirSync(typeDir, { recursive: true });
    }
    const mediaRepo = appDataSource.getRepository(Media);
    let newAlt = alt || '';
    if (!newAlt || newAlt.length === 0) {
      const originalName = file.originalname;
      const fileName = originalName.split('.', 1)[0];
      newAlt = fileName;
    }
    const media = mediaRepo.create({
      type,
      alt: newAlt,
      path: '',
      size: file.size,
      updatedBy: this.ctx.session.admin,
    });
    await mediaRepo.save(media);
    const originalName = file.originalname;
    const extName = path.extname(originalName);
    const fileName = `${media.id}${extName}`;
    const filePath = path.join(typeDir, fileName);
    const fileBuffer = file.buffer || fs.readFileSync(file.path);
    fs.writeFileSync(filePath, fileBuffer);
    const relativePath = `/${type}/${fileName}`;
    media.path = relativePath;
    await mediaRepo.save(media);

    // 记录审计日志和创建版本
    await this.auditService.logCreate('media', media.id, media.alt || media.path, {
      path: media.path,
      type: media.type,
      alt: media.alt,
      size: media.size,
    });

    return {
      id: media.id,
      path: media.path,
      type: media.type,
      alt: media.alt,
      active: media.active,
      size: media.size,
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
      updatedBy: media.updatedBy
        ? {
            id: media.updatedBy.id,
            username: media.updatedBy.username,
            avatar: media.updatedBy.avatar,
          }
        : undefined,
    };
  }

  async getMediaById(id: number): Promise<MediaDetailResDTO> {
    const mediaRepo = appDataSource.getRepository(Media);
    const media = await mediaRepo.findOne({
      where: { id },
      relations: ['updatedBy'],
    });

    if (!media) {
      throw new Error('Media not found');
    }

    return {
      id: media.id,
      path: media.path,
      type: media.type,
      alt: media.alt,
      active: media.active,
      size: media.size,
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
      updatedBy: media.updatedBy
        ? {
            id: media.updatedBy.id,
            username: media.updatedBy.username,
            avatar: media.updatedBy.avatar,
          }
        : undefined,
    };
  }

  async updateMedia(id: number, alt?: string): Promise<void> {
    const mediaRepo = appDataSource.getRepository(Media);
    const media = await mediaRepo.findOne({ where: { id } });

    if (!media) {
      throw new Error('Media not found');
    }

    if (alt !== undefined) {
      const oldData = {
        path: media.path,
        type: media.type,
        alt: media.alt,
        size: media.size,
      };

      media.alt = alt;
      media.updatedBy = this.ctx.session.admin;
      await mediaRepo.save(media);

      // 记录审计日志
      const newData = {
        path: media.path,
        type: media.type,
        alt: media.alt,
        size: media.size,
      };
      await this.auditService.logUpdate('media', media.id, media.alt || media.path, oldData, newData);
    }
  }

  async deleteMedia(id: number): Promise<void> {
    const mediaRepo = appDataSource.getRepository(Media);
    const media = await mediaRepo.findOne({ where: { id } });

    if (!media) {
      throw new Error('Media not found');
    }

    // 保存删除前的数据用于审计
    const oldData = {
      path: media.path,
      type: media.type,
      alt: media.alt,
      size: media.size,
    };

    // 记录删除日志并标记版本为已删除
    await this.auditService.logDelete('media', media.id, media.alt || media.path, oldData);

    const filePath = path.join(process.cwd(), 'public', media.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 删除数据库记录
    await mediaRepo.remove(media);
  }

  // ==================== 分片上传相关方法 ====================

  /**
   * 初始化分片上传
   */
  async initChunkUpload(data: InitChunkUploadReqDTO): Promise<InitChunkUploadResDTO> {
    const { filename, fileSize, type, alt, totalChunks } = data;

    // 验证文件扩展名
    const ext = path.extname(filename).toLowerCase().slice(1);
    const config = getMediaTypeConfig(type);
    if (!config) {
      throw new Error(`不支持的媒体类型: ${type}`);
    }
    if (!config.extensions.includes(ext)) {
      throw new Error(`不支持的文件扩展名: ${ext}`);
    }

    // 生成唯一上传ID
    const uploadId = crypto.randomBytes(16).toString('hex');

    // 创建临时目录
    const tempDir = path.join(process.cwd(), 'temp', 'chunks', uploadId);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // 保存上传状态
    const state: ChunkUploadState = {
      uploadId,
      filename,
      fileSize,
      type,
      alt,
      totalChunks,
      receivedChunks: new Set(),
      tempDir,
      createdAt: new Date(),
      admin: this.ctx.session.admin,
    };
    chunkUploadStates.set(uploadId, state);

    return {
      uploadId,
      chunkSize: CHUNK_SIZE,
    };
  }

  /**
   * 上传单个分片
   */
  async uploadChunk(data: UploadChunkReqDTO): Promise<UploadChunkResDTO> {
    const { uploadId, chunkIndex: chunkIndexStr, chunk } = data;
    const chunkIndex = parseInt(chunkIndexStr, 10);

    const state = chunkUploadStates.get(uploadId);
    if (!state) {
      throw new Error('无效的上传ID，上传可能已过期');
    }

    // 验证分片索引
    if (chunkIndex < 0 || chunkIndex >= state.totalChunks) {
      throw new Error(`无效的分片索引: ${chunkIndex}`);
    }

    // 保存分片到临时目录
    const chunkPath = path.join(state.tempDir, `chunk_${chunkIndex}`);
    const chunkBuffer = chunk.buffer || fs.readFileSync(chunk.path);
    fs.writeFileSync(chunkPath, chunkBuffer);

    // 标记分片已接收
    state.receivedChunks.add(chunkIndex);

    return {
      chunkIndex,
      received: true,
    };
  }

  /**
   * 完成分片上传，合并文件
   */
  async completeChunkUpload(data: CompleteChunkUploadReqDTO): Promise<CompleteChunkUploadResDTO> {
    const { uploadId } = data;

    const state = chunkUploadStates.get(uploadId);
    if (!state) {
      throw new Error('无效的上传ID，上传可能已过期');
    }

    // 检查是否所有分片都已接收
    if (state.receivedChunks.size !== state.totalChunks) {
      const missing = [];
      for (let i = 0; i < state.totalChunks; i++) {
        if (!state.receivedChunks.has(i)) {
          missing.push(i);
        }
      }
      throw new Error(`缺少分片: ${missing.join(', ')}`);
    }

    // 创建目标目录
    const publicDir = path.join(process.cwd(), 'public');
    const typeDir = path.join(publicDir, state.type);
    if (!fs.existsSync(typeDir)) {
      fs.mkdirSync(typeDir, { recursive: true });
    }

    // 在数据库中创建记录
    const mediaRepo = appDataSource.getRepository(Media);
    let newAlt = state.alt || '';
    if (!newAlt || newAlt.length === 0) {
      const fileName = state.filename.split('.')[0];
      newAlt = fileName;
    }

    const media = mediaRepo.create({
      type: state.type,
      alt: newAlt,
      path: '',
      size: state.fileSize,
      updatedBy: state.admin,
    });
    await mediaRepo.save(media);

    // 生成最终文件路径
    const extName = path.extname(state.filename);
    const fileName = `${media.id}${extName}`;
    const finalPath = path.join(typeDir, fileName);

    // 合并分片
    const writeStream = fs.createWriteStream(finalPath);
    for (let i = 0; i < state.totalChunks; i++) {
      const chunkPath = path.join(state.tempDir, `chunk_${i}`);
      const chunkData = fs.readFileSync(chunkPath);
      writeStream.write(chunkData);
    }
    writeStream.end();

    // 等待写入完成
    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // 更新数据库记录的路径
    const relativePath = `/${state.type}/${fileName}`;
    media.path = relativePath;
    await mediaRepo.save(media);

    // 清理临时文件
    this.cleanupTempDir(state.tempDir);

    // 删除上传状态
    chunkUploadStates.delete(uploadId);

    return {
      id: media.id,
      path: media.path,
      type: media.type,
      alt: media.alt,
      active: media.active,
      size: media.size,
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
      updatedBy: state.admin
        ? {
            id: state.admin.id,
            username: state.admin.username,
            avatar: state.admin.avatar,
          }
        : undefined,
    };
  }

  /**
   * 清理临时目录
   */
  private cleanupTempDir(tempDir: string): void {
    try {
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        for (const file of files) {
          fs.unlinkSync(path.join(tempDir, file));
        }
        fs.rmdirSync(tempDir);
      }
    } catch (error) {
      console.error('清理临时目录失败:', error);
    }
  }
}
