export type Platform = "bilibili" | "douyu" | "huya"

export interface PlatformConfig {
  id: Platform
  name: string
  fetchFn: () => Promise<any>
}
