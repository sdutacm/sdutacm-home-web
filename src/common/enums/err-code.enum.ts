export enum ErrCode {
  /** 未捕获异常 */
  SystemError = -1,
  /** 非法请求 */
  IllegalRequest = -2,
  /** 非法参数 */
  IllegalParameters = -3,

  /** 管理员未登录 */
  AdminNotLoggedIn = -4,
  /** 管理员权限不足 */
  AdminPermissionDenied = -5,

  // 自定义逻辑异常错误码
  // ...
}
