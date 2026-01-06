import { InjectCtx, RequestContext, Data, Contract, Post } from 'bwcx-ljsm';
import { ApiController } from '@server/decorators';
import { Api } from 'bwcx-api';
import { Inject } from 'bwcx-core';
import {
  UploadMediaReqDTO,
  GetMediaListReqDTO,
  GetMediaByIdReqDTO,
  DeleteMediaReqDTO,
  MediaResDTO,
} from '@common/modules/media/media.dto';
import MediaService from './media.service';

@ApiController()
export default class MediaController {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
    @Inject()
    private readonly mediaService: MediaService,
  ) {}

  /** routes */
  @Api.Summary('媒体资源上传接口')
  @Post('/uploadMedia')
  @Contract(UploadMediaReqDTO, MediaResDTO)
  public async uploadMedia(@Data() data: UploadMediaReqDTO): Promise<MediaResDTO> {
    return await this.mediaService.uploadMedia(data);
  }

  @Api.Summary('获取媒体资源列表')
  @Post('/getMediaList')
  @Contract(GetMediaListReqDTO, [MediaResDTO])
  public async getMediaList(@Data() data: GetMediaListReqDTO): Promise<MediaResDTO[]> {
    return await this.mediaService.getMediaList(data.type);
  }

  @Api.Summary('根据 ID 获取媒体资源')
  @Post('/getMediaById')
  @Contract(GetMediaByIdReqDTO, MediaResDTO)
  public async getMediaById(@Data() data: GetMediaByIdReqDTO): Promise<MediaResDTO | null> {
    return await this.mediaService.getMediaById(data.id);
  }

  @Api.Summary('删除媒体资源')
  @Post('/deleteMedia')
  @Contract(DeleteMediaReqDTO, null)
  public async deleteMedia(@Data() data: DeleteMediaReqDTO): Promise<void> {
    await this.mediaService.deleteMedia(data.id);
  }
}
