import { Service, InjectCtx, RequestContext } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import { MediaTypeEnum } from '@common/enums/media-type.enum';
import { GetMediaListReqDTO, GetMediaListResDTO, UploadMediaReqDTO, MediaDetailResDTO } from '@common/modules/media/media.dto';
import appDataSource from '@server/db';
import { Media } from '@server/db/entity/media';
import * as fs from 'fs';
import * as path from 'path';

@Service()
export default class MediaService {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
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
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    const typeDir = path.join(publicDir, type);
    if (!fs.existsSync(typeDir)) {
      fs.mkdirSync(typeDir, { recursive: true });
    }
    const mediaRepo = appDataSource.getRepository(Media);
    let newAlt = '';
    if (!alt || alt.length === 0) {
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
      media.alt = alt;
      media.updatedBy = this.ctx.session.admin;
      await mediaRepo.save(media);
    }
  }

  async deleteMedia(id: number): Promise<void> {
    const mediaRepo = appDataSource.getRepository(Media);
    const media = await mediaRepo.findOne({ where: { id } });

    if (!media) {
      throw new Error('Media not found');
    }

    const filePath = path.join(process.cwd(), 'public', media.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 删除数据库记录
    await mediaRepo.remove(media);
  }
}
