import { InParam, BaseType } from "bwcx-client-vue";

export class MediaRPO {
  @InParam()
  @BaseType(String)
  id: string;
}
