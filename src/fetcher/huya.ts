import { NotLoginError } from "~types/errors"
import type { Room } from "~types/Room"

const url = "https://fw.huya.com/dispatch?do=subscribeList&uid="
const urlPrefix = "https://www.huya.com/"
let uid = -1
async function hyFetch(): Promise<Room[]> {
  try {
    if (uid === -1) {
      const loginCheck = await fetch(
        "https://www.huya.com/udb_web/checkLogin.php"
      ).then((data) => data.json())

      if (!loginCheck.isLogined) {
        throw new NotLoginError("huya", "https://www.huya.com/")
      }
      uid = loginCheck.uid
    }

    if (uid === 0) return []

    return fetch(url + uid)
      .then((res) => res.json())
      .then(hyFilter)
  } catch (error) {
    if (error instanceof NotLoginError) {
      throw error
    }
    console.error("获取虎牙数据失败")
    console.error(error)
    return []
  }
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
    (item) =>
      ({
        roomId: `huya_${item.uid}`,
        roomName: item.intro,
        streamerName: item.nick,
        cover: item.screenshot,
        avatar: item.avatar180,
        isOpen: item.isLive,
        platform: "huya",
        areaName: item.gameName,
        url: `https://www.huya.com/${item.profileRoom}`
      }) as Room
  )
}
export { hyFetch, hyFilter }
