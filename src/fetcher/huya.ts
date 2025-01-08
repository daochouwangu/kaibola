import type { Room } from "~types/Room"

const url = "https://fw.huya.com/dispatch?do=subscribeList&uid="
const urlPrefix = "https://www.huya.com/"
let uid = -1
async function hyFetch(): Promise<Room[]> {
  if (uid === -1) {
    uid = await new Promise((resolve) => {
      fetch("https://www.huya.com/udb_web/checkLogin.php")
        .then((data) => data.json())
        .then((data) => {
          resolve(data.uid)
        })
    })
  }
  if (uid === 0) return []
  return fetch(url + uid)
    .then((res) => res.json())
    .then(hyFilter)
    .catch((error) => {
      console.error("获取虎牙数据失败")
      console.error(error)
      return []
    })
}
function hyFilter(data): Room[] {
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
    console.error("huya data can not be empty:" + data)
    return []
  }
  let list = data.result.list
  return list.map(
    ({ startTime, profileRoom, isLive, intro, nick, screenshot }) => ({
      showTime: startTime,
      roomId: profileRoom,
      isOpen: isLive,
      url: urlPrefix + profileRoom,
      roomName: intro,
      nickName: nick,
      snapshot: screenshot
    })
  )
}
export { hyFetch, hyFilter }
