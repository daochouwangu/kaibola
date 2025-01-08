import type { Room } from "~types/Room";

const url = "https://www.douyu.com/wgapi/livenc/liveweb/follow/list";
const urlPrefix = "https://www.douyu.com";
async function dyFetch(): Promise<Room[]> {
  return fetch(url).then(res => res.json()).then(dyFilter).catch(error => {
    console.error("获取斗鱼数据失败")
    console.error(error);
    return [];
  })
}
function dyFilter(data) {
  /**
   * @showtime 开播时间
   * @show_status 开播状态 1表示开播 2表示关播
   * @room_id 房间房号(非靓号,原始房号)
   * @is_special 是否是特别关注 1是 0否
   * @url 房间地址(一般是房号 或者 靓号)
   * @room_name 房间名称
   * @nickname 主播名称
   * @videoLoop 是否在播放录像 1是 0否
   * @vertical_src 快照
   */
  if (!data || !data.data) {
    console.error("dyfilter data can not be empty:"+data);
    return [];
  }
  let list = data.data.list;
  return list.map(({
    show_time,
    room_id,
    show_status,
    url,
    room_name,
    nickname,
    videoLoop,
    vertical_src
  }) => ({
    showTime: show_time,
    roomId: room_id,
    isOpen: show_status === 1 && videoLoop !== 1,
    url: urlPrefix+url,
    roomName: room_name,
    nickName: nickname,
    snapshot: vertical_src
  }))
}
export {
  dyFetch,
  dyFilter
}
