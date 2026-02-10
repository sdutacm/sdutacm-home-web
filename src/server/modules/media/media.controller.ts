import { Controller, InjectCtx, RequestContext, Post, Data, Contract } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import { ApiController } from '@server/decorators';
import { Api } from 'bwcx-api';
import MediaService from './media.service';
import { GetMediaListReqDTO, GetMediaListResDTO, UploadMediaReqDTO, DeleteMediaReqDTO, GetMediaByIdReqDTO, MediaDetailResDTO, UpdateMediaReqDTO } from '@common/modules/media/media.dto';

@ApiController()
export default class MediaController {
  public constructor(
    @InjectCtx()
    private readonly ctx: RequestContext,
    @Inject()
    private readonly mediaService: MediaService,
  ) {}

  /** routes */
  @Api.Summary('获取媒体列表')
  @Post('/getMediaList')
  @Contract(GetMediaListReqDTO, GetMediaListResDTO)
  public async getMediaList(@Data() data: GetMediaListReqDTO): Promise<GetMediaListResDTO> {
    return await this.mediaService.getMediaList(data.type, data.page, data.pageSize);
  }

  @Api.Summary('上传媒体文件')
  @Post('/uploadMedia')
  @Contract(UploadMediaReqDTO, MediaDetailResDTO)
  public async uploadMedia(@Data() data: UploadMediaReqDTO): Promise<MediaDetailResDTO> {
    return await this.mediaService.uploadMedia(data);
  }

  @Api.Summary('获取媒体详情')
  @Post('/getMediaById')
  @Contract(GetMediaByIdReqDTO, MediaDetailResDTO)
  public async getMediaById(@Data() data: GetMediaByIdReqDTO): Promise<MediaDetailResDTO> {
    return await this.mediaService.getMediaById(data.id);
  }

  @Api.Summary('更新媒体信息')
  @Post('/updateMedia')
  @Contract(UpdateMediaReqDTO, null)
  public async updateMedia(@Data() data: UpdateMediaReqDTO): Promise<void> {
    await this.mediaService.updateMedia(data.id, data.alt);
  }

  @Api.Summary('删除媒体文件')
  @Post('/deleteMedia')
  @Contract(DeleteMediaReqDTO, null)
  public async deleteMedia(@Data() data: DeleteMediaReqDTO): Promise<void> {
    await this.mediaService.deleteMedia(data.id);
  }
}
