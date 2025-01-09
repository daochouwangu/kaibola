interface LoginAlertProps {
  platform: string
  loginUrl: string
}

export function LoginAlert({ platform, loginUrl }: LoginAlertProps) {
  const platformName = {
    douyu: "斗鱼",
    bilibili: "B站",
    huya: "虎牙",
    twitch: "Twitch"
  }[platform]

  return (
    <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
      <span>{platformName}未登录或登录已过期</span>
      <a
        href={loginUrl}
        target="_blank"
        className="text-blue-500 hover:text-blue-700 text-sm">
        去登录
      </a>
    </div>
  )
}
