import { FromBody, IsFile } from "bwcx-common";

export class UploadImageReqDTO {
  @FromBody()
  @IsFile()
  file: any;

  @FromBody()
  fileName: string;
}
