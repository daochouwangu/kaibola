export interface TwitchConfig {
  clientId: string
  authToken: string
}

export type Platform = "bilibili" | "douyu" | "huya" | "twitch"

export interface PlatformConfig {
  id: Platform
  name: string
  fetchFn: () => Promise<any>
  requiresAuth?: boolean
  authConfig?: {
    configFields: Array<{
      key: string
      label: string
      type: "text" | "password"
    }>
  }
}
