//
const url = "https://api.bilibili.com/x/relation/tag/special";
async function biliFetch() {
  let user = await fetch(url).then(data => data.json()).catch(error => {
    console.error("获取bilibili数据失败");
    console.error(error);
    return [];
  });
  let api = "https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids?"
  let uids = user.data
  for(var i in uids){
    api += 'uids[]=' + uids[i] + '&';
  }
  let obj = await fetch(api).then(res => res.json());
  let list = [];
  let live = obj.data;
  for (var i = 0; i < uids.length;i++) {
    list.push(live[uids[i]]);
  }
  return biliFilter(list);
}
function biliFilter(data) {
  /**
   * @room_id 房间房号(非靓号,原始房号)
   * @live_time 开播时间
   * @live_status 开播状态 1表示开播 0表示关播 2：轮播中
   * @link 房间地址(一般是房号 或者 靓号) 无！
   * @title 房间名称*
   * @uname 主播名称*
   * @keyframe 快照
   */
  if (!data || !data) {
    console.error("dyfilter data can not be empty:"+data);
    return [];
  }
  let list = data;
  return list.map(({
    room_id,
    live_time,
    live_status,
    //link,
    title,
    uname,
    keyframe
  }) => ({
    showTime: live_time,
    roomId: room_id,
    isOpen: live_status === 1,
    //url: link,
    roomName: title,
    nickName: uname,
    snapshot: keyframe
  }))
}
export {
  biliFetch,
  biliFilter
}
