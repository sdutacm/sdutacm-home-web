import { ExceptionHandler, GuardNotPassException } from 'bwcx-ljsm';
import type { IBwcxExceptionHandler, RequestContext } from 'bwcx-ljsm';
import { ErrCode } from '@common/enums/err-code.enum';
import { errCodeConfigs } from '@server/err-code-configs';

@ExceptionHandler(GuardNotPassException)
export default class GuardNotPassExceptionHandler implements IBwcxExceptionHandler {
  public catch(e: GuardNotPassException, ctx: RequestContext) {
    // 判断是 API 请求还是页面访问
    const isApiRequest = ctx.path.startsWith('/api/');

    if (isApiRequest) {
      // API 请求返回 JSON 错误
      ctx.body = {
        success: false,
        code: ErrCode.AdminNotLoggedIn,
        msg: errCodeConfigs[ErrCode.AdminNotLoggedIn],
      };
    } else {
      // 页面访问重定向到登录页
      ctx.redirect('/login');
    }
  }
}
