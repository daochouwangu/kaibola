//

import type { Room } from "~types/Room";

// const url = "https://api.live.bilibili.com/relation/v1/Feed/getList";
const url = "https://api.live.bilibili.com/xlive/web-ucenter/user/following?page=1&page_size=9&ignoreRecord=0&hit_ab=true"
async function biliFetch(): Promise<Room[]> {
  return fetch(url).then(res => res.json()).then(biliFilter).catch(error => {
    console.error("获取bilibili数据失败")
    console.error(error);
    return [];
  })
}
function biliFilter(data) {
  /**
   {
  "roomid": 11776509,
  "uid": 6555381,
  "uname": "超甜der梨子",
  "title": "白噪音自习室/很酷不聊天",
  "face": "https://i0.hdslb.com/bfs/face/3467d4e43c644b22f288b695aea4e99fee7e1e11.jpg",
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
  "area_name_v2": "校园学习",
  "room_news": "11.20下午请假",
  "switch": true,
  "watch_icon": "https://i0.hdslb.com/bfs/live/a725a9e61242ef44d764ac911691a7ce07f36c1d.png",
  "text_small": "315",
  "room_cover": "http://i0.hdslb.com/bfs/live/user_cover/f37dec2de48a41c90fb05570d707eb3cb046a468.jpg"
}
   */
  console.log("biliFilter", data);
  if (!data || !data.data) {
    console.error("dyfilter data can not be empty:"+data);
    return [];
  }
  let list = data.data.list;
  return list.map(({
    roomid,
    live_status,
    title,
    uname,
    room_cover
  }) => ({
    showTime: undefined,
    roomId: roomid,
    isOpen: live_status === 1,
    url: `https://live.bilibili.com/${roomid}`,
    roomName: title,
    nickName: uname,
    snapshot: room_cover
  }))
}
export {
  biliFetch,
  biliFilter
}
