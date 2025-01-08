export class NotLoginError extends Error {
  platform: string
  loginUrl: string

  constructor(platform: string, loginUrl: string) {
    super(`未登录或登录已过期: ${platform}`)
    this.name = "NotLoginError"
    this.platform = platform
    this.loginUrl = loginUrl
  }
}
