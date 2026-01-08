import { ExceptionHandler, GuardNotPassException } from 'bwcx-ljsm';
import type { IBwcxExceptionHandler, RequestContext } from 'bwcx-ljsm';
import { ErrCode } from '@common/enums/err-code.enum';
import { errCodeConfigs } from '@server/err-code-configs';

@ExceptionHandler(GuardNotPassException)
export default class GuardNotPassExceptionHandler implements IBwcxExceptionHandler {
  public catch(e: GuardNotPassException, ctx: RequestContext) {
    ctx.redirect('/login')
    ctx.body = {
      success: false,
      code: ErrCode.AdminNotLoggedIn,
      msg: errCodeConfigs[ErrCode.AdminNotLoggedIn],
    };
  }
}
