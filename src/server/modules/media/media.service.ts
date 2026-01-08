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

  async getMediaList(type: MediaTypeEnum): Promise<GetMediaResDTO> {
    try {
      const mediaRepo = appDataSource.getRepository(Media);
      const list = await mediaRepo.find({
        where: {
          type: type,
        },
      });
      return { rows: list };
    } catch (error) {
      console.error('Error fetching media list:', error);
    }
  }

  async uploadMedia(data: UploadMediaReqDTO): Promise<Media> {
    const { file, type, alt } = data;

    // 确保 public 目录存在
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // 根据类型确定目标目录
    const typeDir = path.join(publicDir, type);
    if (!fs.existsSync(typeDir)) {
      fs.mkdirSync(typeDir, { recursive: true });
    }

    // 创建数据库记录以获取 id
    const mediaRepo = appDataSource.getRepository(Media);
    const media = mediaRepo.create({
      type,
      alt,
      path: '', // 临时路径，稍后更新
      active: true,
    });
    await mediaRepo.save(media);

    // 获取文件扩展名
    const originalName = file.originalname || file.name;
    const extName = path.extname(originalName);

    // 基于 id 生成文件名
    const fileName = `${media.id}${extName}`;
    const filePath = path.join(typeDir, fileName);

    // 保存文件
    const fileBuffer = file.buffer || fs.readFileSync(file.path);
    fs.writeFileSync(filePath, fileBuffer);

    // 更新数据库中的路径
    const relativePath = `/${type}/${fileName}`;
    media.path = relativePath;
    await mediaRepo.save(media);

    return media;
  }

  async deleteMedia(id: number): Promise<void> {
    const mediaRepo = appDataSource.getRepository(Media);
    const media = await mediaRepo.findOne({ where: { id } });

    if (!media) {
      throw new Error('Media not found');
    }

    // 删除文件
    const filePath = path.join(process.cwd(), 'public', media.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 删除数据库记录
    await mediaRepo.remove(media);
  }
}
