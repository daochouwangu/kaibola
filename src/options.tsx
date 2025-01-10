import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import type { Platform } from "~types/platform"
import { getEnabledPlatforms, PLATFORM_CONFIGS } from "~utils/platforms"

import "./main.css"

const storage = new Storage({
  area: "sync",
  allCopied: true
})

function IndexOptions() {
  const [enableNotification, setEnableNotification] = useStorage<boolean>({
    key: "enable_notification",
    instance: storage
  })

  const [enabledPlatforms, setEnabledPlatforms] = useStorage<Platform[]>({
    key: "enabled_platforms",
    instance: storage
  })

  const [twitchConfig, setTwitchConfig] = useStorage({
    key: "twitch_config",
    instance: storage
  })

  const [checkInterval, setCheckInterval] = useStorage<number>({
    key: "check_interval",
    instance: storage
  })

  const actualEnableNotification = enableNotification || false
  const actualEnabledPlatforms = enabledPlatforms || ["bilibili", "douyu"]
  const actualCheckInterval = checkInterval || 3 // 默认3分钟

  const handleTwitchAuth = () => {
    chrome.tabs.create({
      url: "https://www.twitch.tv/?source=kaibola_auth"
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold text-gray-900">设置</h1>

        <div className="space-y-6 rounded-lg bg-white p-6 shadow">
          {/* 平台设置 */}
          <div className="flex-1">
            <h2 className="font-medium text-gray-900 mb-4">启用平台</h2>
            <div className="space-y-2">
              {PLATFORM_CONFIGS.map((platform) => (
                <div key={platform.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`platform-${platform.id}`}
                    checked={actualEnabledPlatforms?.includes(platform.id)}
                    onChange={(e) => {
                      const newPlatforms = e.target.checked
                        ? [...(actualEnabledPlatforms || []), platform.id]
                        : (actualEnabledPlatforms || []).filter(
                            (p) => p !== platform.id
                          )
                      setEnabledPlatforms(newPlatforms)
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label
                    htmlFor={`platform-${platform.id}`}
                    className="text-gray-700">
                    {platform.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-gray-200" />

          {/* 开播提醒设置 */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={actualEnableNotification}
                  onChange={(e) => setEnableNotification(e.target.checked)}
                  id="enable-notification"
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label
                  htmlFor="enable-notification"
                  className="font-medium text-gray-900">
                  开播提醒
                </label>
              </div>
              <p className="mt-1 text-sm text-gray-500 ml-6">
                当关注的主播开播时发送系统通知
              </p>

              {/* 添加检查间隔设置 */}
              {actualEnableNotification && (
                <div className="mt-4 ml-6">
                  <label className="block text-sm font-medium text-gray-700">
                    检查间隔（分钟）
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={actualCheckInterval}
                    onChange={(e) => {
                      const value = parseInt(e.target.value)
                      if (value >= 1 && value <= 60) {
                        setCheckInterval(value)
                      }
                    }}
                    className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Twitch 配置部分 */}
        {actualEnabledPlatforms?.includes("twitch") && (
          <div className="mt-6 space-y-6 rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-gray-900">Twitch 配置</h2>
              <button
                onClick={handleTwitchAuth}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                自动获取认证
              </button>
            </div>

            {twitchConfig?.authToken ? (
              <div className="text-sm text-green-600">✓ 已配置认证信息</div>
            ) : (
              <div className="text-sm text-gray-500">
                点击上方按钮自动获取认证信息
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Auth Token
                </label>
                <input
                  type="password"
                  value={twitchConfig?.authToken || ""}
                  onChange={(e) =>
                    setTwitchConfig({
                      ...twitchConfig,
                      authToken: e.target.value
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default IndexOptions
