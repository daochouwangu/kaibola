import type { Room } from "~types/Room"

const url = "https://www.douyu.com/wgapi/livenc/liveweb/follow/list"
const urlPrefix = "https://www.douyu.com"
async function dyFetch(): Promise<Room[]> {
  return fetch(url)
    .then((res) => res.json())
    .then(dyFilter)
    .catch((error) => {
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
    return data.data.map((item) => ({
      roomId: `dy_${item.room_id}`,
      roomName: item.room_name,
      userName: item.nickname,
      cover: item.room_pic,
      avatar: item.avatar_small,
      isOpen: item.show_status === "1",
      platform: "douyu",
      url: `https://www.douyu.com/${item.room_id}`
    }))
  } catch (error) {
    console.warn("解析斗鱼数据失败:", error)
    return []
  }
}
export { dyFetch, dyFilter }
