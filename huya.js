const url = "https://fw.huya.com/dispatch?do=subscribeList&uid=";
const urlPrefix = "https://www.huya.com/";
let uid = -1;
async function hyFetch() {
  if (uid === -1) {
    uid = await new Promise((resolve) => {
      chrome.cookies.getAll({domain: ".huya.com", name: "udb_uid"},(uids)=>{
        if (uids.length === 0) {
          resolve(0);
        }
        resolve(uids[0].value);
      })
    })
  }
  if (uid === 0) return [];
  return fetch(url+uid).then(res => res.json()).then(hyFilter).catch(error => {
    console.error("获取虎牙数据失败")
    console.error(error);
    return [];
  })
}
function hyFilter(data) {
  /**
   * @startTime 开播时间
   * @isLive 开播状态 
   * @profileRoom 房间房号
   * @url 房间地址(一般是房号 或者 靓号)
   * @intro 房间名称
   * @nick 主播名称
   * @videoLoop 是否在播放录像 1是 0否
   */
  if (!data || !data.result) {
    console.error("huya data can not be empty:"+data);
    return [];
  }
  let list = data.result.list;
  return list.map(({
    startTime,
    profileRoom,
    isLive,
    intro,
    nick,
    screenshot
  }) => ({
    showTime: startTime,
    roomId: profileRoom,
    isOpen: isLive,
    url: urlPrefix+profileRoom,
    roomName: intro,
    nickName: nick,
    snapshot: screenshot
  }))
}
export {
  hyFetch,
  hyFilter
}
