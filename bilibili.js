//
const url = "https://api.live.bilibili.com/relation/v1/Feed/getList";
async function biliFetch() {
  return fetch(url).then(res => res.json()).then(biliFilter).catch(error => {
    console.error("获取bilibili数据失败")
    console.error(error);
    return [];
  })
}
function biliFilter(data) {
  /**
   * @room_id 房间房号(非靓号,原始房号)
   * @liveTime 开播时间
   * @live_status 开播状态 1表示开播 0表示关播
   * @link 房间地址(一般是房号 或者 靓号)
   * @roomname 房间名称
   * @nickname 主播名称
   * @keyframe 快照
   */
  if (!data || !data.data) {
    console.error("dyfilter data can not be empty:"+data);
    return [];
  }
  let list = data.data.list;
  return list.map(({
    room_id,
    liveTime,
    live_status,
    link,
    roomname,
    nickname,
    keyframe
  }) => ({
    showTime: liveTime,
    roomId: room_id,
    isOpen: live_status === 1,
    url: link,
    roomName: roomname,
    nickName: nickname,
    snapshot: keyframe
  }))
}
export {
  biliFetch,
  biliFilter
}
