import { Controller, InjectCtx, RequestContext, Post, Data, Contract } from 'bwcx-ljsm';
import { Inject } from 'bwcx-core';
import { ApiController } from '@server/decorators';
import { Api } from 'bwcx-api';
import MediaService from './media.service';
import { GetMediaListReqDTO, GetMediaResDTO, UploadMediaReqDTO, DeleteMediaReqDTO } from '@common/modules/media/media.dto';

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
  @Contract(GetMediaListReqDTO, GetMediaResDTO)
  public async getMediaList(@Data() data: GetMediaListReqDTO): Promise<GetMediaResDTO> {
    return await this.mediaService.getMediaList(data.type);
  }

  @Api.Summary('上传媒体文件')
  @Post('/uploadMedia')
  @Contract(UploadMediaReqDTO, null)
  public async uploadMedia(@Data() data: UploadMediaReqDTO): Promise<any> {
    const media = await this.mediaService.uploadMedia(data);
    return { success: true, data: media };
  }

  @Api.Summary('删除媒体文件')
  @Post('/deleteMedia')
  @Contract(DeleteMediaReqDTO, null)
  public async deleteMedia(@Data() data: DeleteMediaReqDTO): Promise<void> {
    await this.mediaService.deleteMedia(data.id);
  }
}
