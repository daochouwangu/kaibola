import { Storage } from "@plasmohq/storage"

import { biliFetch } from "~fetcher/bilibili"
import { dyFetch } from "~fetcher/douyu"
import { hyFetch } from "~fetcher/huya"
import { twitchFetch } from "~fetcher/twitch"
import { NotLoginError } from "~types/errors"
import type { Platform, PlatformConfig } from "~types/platform"
import type { Room } from "~types/Room"

export const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    id: "bilibili",
    name: "哔哩哔哩",
    fetchFn: biliFetch
  },
  {
    id: "douyu",
    name: "斗鱼",
    fetchFn: dyFetch
  },
  {
    id: "huya",
    name: "虎牙",
    fetchFn: hyFetch
  },
  {
    id: "twitch",
    name: "Twitch",
    fetchFn: twitchFetch,
    requiresAuth: true,
    authConfig: {
      configFields: [
        {
          key: "clientId",
          label: "Client ID",
          type: "text"
        },
        {
          key: "authToken",
          label: "Auth Token",
          type: "password"
        }
      ]
    }
  }
]

const storage = new Storage({
  area: "sync",
  allCopied: true
})

const DEFAULT_PLATFORMS: Platform[] = ["bilibili", "douyu"]

export async function getEnabledPlatforms(): Promise<Platform[]> {
  const platforms = await storage.get<Platform[]>("enabled_platforms")
  if (platforms === undefined) {
    // 第一次使用,设置默认值
    await storage.set("enabled_platforms", DEFAULT_PLATFORMS)
    return DEFAULT_PLATFORMS
  }
  return platforms
}

export async function fetchRoomData() {
  const enabledPlatforms = await getEnabledPlatforms()
  const errors: NotLoginError[] = []
  const rooms: Room[] = []

  const results = await Promise.allSettled(
    PLATFORM_CONFIGS.filter((config) =>
      enabledPlatforms.includes(config.id)
    ).map((config) => config.fetchFn())
  )

  results.forEach((result, index) => {
    const platform = enabledPlatforms[index]
    if (result.status === "fulfilled") {
      rooms.push(...result.value)
    } else {
      if (result.reason instanceof NotLoginError) {
        errors.push(result.reason)
      } else {
        console.warn(`获取${platform}数据失败:`, result.reason)
      }
    }
  })

  return { rooms, errors }
}
