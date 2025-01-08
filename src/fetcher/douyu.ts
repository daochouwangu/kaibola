import { NotLoginError } from "~types/errors"
import type { Room } from "~types/Room"

const url = "https://www.douyu.com/wgapi/livenc/liveweb/follow/list"
const urlPrefix = "https://www.douyu.com"
async function dyFetch(): Promise<Room[]> {
  return fetch(url)
    .then((res) => res.json())
    .then((data) => {
      if (data.code === -1 && data.msg?.includes("用户未登陆")) {
        throw new NotLoginError("douyu", "https://www.douyu.com/")
      }
      return dyFilter(data)
    })
    .catch((error) => {
      if (error instanceof NotLoginError) {
        throw error
      }
      console.error("获取斗鱼数据失败")
      console.error(error)
      return []
    })
}
const dyFilter = (data: any): Room[] => {
  if (!data || !data.data) {
    console.warn("斗鱼数据格式异常:", data)
    return []
  }

  try {
    return data.data.list.map(
      (item) =>
        ({
          roomId: `dy_${item.room_id}`,
          roomName: item.room_name,
          streamerName: item.nickname,
          cover: item.room_src,
          avatar: item.avatar_small,
          isOpen: item.show_status == 1 && item.videoLoop == 0,
          platform: "douyu",
          areaName: item.game_name,
          url: `https://www.douyu.com${item.url}`
        }) as Room
    )
  } catch (error) {
    console.warn("解析斗鱼数据失败:", error)
    return []
  }
}
export { dyFetch, dyFilter }
