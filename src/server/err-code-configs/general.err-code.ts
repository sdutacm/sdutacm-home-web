import { registerErrCodeConfigs } from '@server/err-code-configs';
import { ErrCode } from '@common/enums/err-code.enum';

registerErrCodeConfigs({
  [ErrCode.SystemError]: '系统异常，请稍后再试',
  [ErrCode.IllegalRequest]: '非法请求',
  [ErrCode.IllegalParameters]: '非法参数',
  [ErrCode.AdminNotLoggedIn]: '管理员未登录',
  [ErrCode.AdminPermissionDenied]: '管理员权限不足',
});
