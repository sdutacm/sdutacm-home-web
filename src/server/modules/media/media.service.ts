import { Service, InjectCtx, RequestContext } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import { MediaTypeEnum } from '@common/enums/media-type.enum';
import { GetMediaListReqDTO, GetMediaResDTO, UploadMediaReqDTO } from '@common/modules/media/media.dto';
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

  async getMediaList(type: MediaTypeEnum, page: number = 1, pageSize: number = 20): Promise<GetMediaResDTO> {
    try {
      const mediaRepo = appDataSource.getRepository(Media);
      const [list, total] = await mediaRepo.findAndCount({
        where: {
          type: type,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        order: {
          createdAt: 'DESC',
        },
      });
      return { rows: list, total };
    } catch (error) {
      console.error('Error fetching media list:', error);
      throw error;
    }
  }

  async uploadMedia(data: UploadMediaReqDTO): Promise<void> {
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
      uploadedBy: this.ctx.session.admin,
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
