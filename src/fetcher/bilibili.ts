//

import { NotLoginError } from "~types/errors"
import type { Room } from "~types/Room"

// const url = "https://api.live.bilibili.com/relation/v1/Feed/getList";
const url =
  "https://api.live.bilibili.com/xlive/web-ucenter/user/following?page=1&page_size=9&ignoreRecord=0&hit_ab=true"
async function biliFetch(): Promise<Room[]> {
  return fetch(url)
    .then((res) => res.json())
    .then((data) => {
      if (data.code === -101 && data.message?.includes("账号未登录")) {
        throw new NotLoginError(
          "bilibili",
          "https://passport.bilibili.com/login"
        )
      }
      return biliFilter(data)
    })
    .catch((error) => {
      if (error instanceof NotLoginError) {
        throw error
      }
      console.error("获取bilibili数据失败")
      console.error(error)
      return []
    })
}
/**
 * 
 * @param data.data {
    "code": 0,
    "message": "0",
    "ttl": 1,
    "data": {
        "title": "哔哩哔哩直播 - 我的关注",
        "pageSize": 9,
        "totalPage": 52,
        "list": [
            {
                "roomid": 21452505,
                "uid": 434334701,
                "uname": "七海Nana7mi",
                "title": "鸣潮！",
                "face": "https://i2.hdslb.com/bfs/face/3adb26401cfab0fe6b1a0d5b2c09220499108d64.jpg",
                "live_status": 1,
                "record_num": 0,
                "recent_record_id": "",
                "is_attention": 1,
                "clipnum": 0,
                "fans_num": 0,
                "area_name": "",
                "area_value": "",
                "tags": "",
                "recent_record_id_v2": "",
                "record_num_v2": 0,
                "record_live_time": 0,
                "area_name_v2": "虚拟Gamer",
                "room_news": "直播时间关注微博@七海Nana7mi",
                "switch": true,
                "watch_icon": "https://i0.hdslb.com/bfs/live/a725a9e61242ef44d764ac911691a7ce07f36c1d.png",
                "text_small": "1.4万",
                "room_cover": "https://i0.hdslb.com/bfs/live/new_room_cover/b9e5005c08b7811014daca2932bcb4b9f2a81219.jpg",
                "parent_area_id": 9,
                "area_id": 745
            }
        ],
        "count": 466,
        "never_lived_count": 288,
        "live_count": 31,
        "never_lived_faces": []
    }
}
 * @returns 
 */
const biliFilter = (data: any): Room[] => {
  if (!data || !data.data || !data.data.list) {
    console.warn("B站数据格式异常:", data)
    return []
  }

  try {
    return data.data.list.map((item) => ({
      roomId: `bili_${item.roomid}`,
      roomName: item.title,
      streamerName: item.uname,
      cover: item.room_cover,
      avatar: item.face,
      isOpen: item.live_status === 1,
      platform: "bilibili",
      url: `https://live.bilibili.com/${item.roomid}`,
      areaName: item.area_name_v2
    }))
  } catch (error) {
    console.warn("解析B站数据失败:", error)
    return []
  }
}
export { biliFetch, biliFilter }
