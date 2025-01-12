import { Storage } from "@plasmohq/storage"

import { fetchRoomData } from "~utils/platforms"

const storage = new Storage()

const ALARM_NAME = "checkLiveStatus"

// 添加错误处理函数
function handleError(error: Error) {
  if (error.message === "Extension context invalidated.") {
    return
  }
  console.error(error)
}

async function checkLiveStatus() {
  console.log("checkLiveStatus")
  try {
    const muteNotification =
      (await storage.get<boolean>("mute_notification")) ?? false // 默认为 false
    if (muteNotification) return

    const { rooms } = await fetchRoomData()
    const lastStatus =
      (await storage.get<Record<string, boolean>>("last_status")) || {}
    const hiddenRooms = (await storage.get<string[]>("hidden_rooms")) || []
    const newStatus: Record<string, boolean> = { ...lastStatus } // 保留上一次的状态

    // 收集新开播的主播
    const newLiveStreamers = []
    for (const room of rooms) {
      // 更新状态并检查是否需要通知
      const oldStatus = lastStatus[room.roomId]
      newStatus[room.roomId] = room.isOpen

      if (!oldStatus && room.isOpen) {
        if (!hiddenRooms.includes(room.roomId)) {
          newLiveStreamers.push(room)
        }
      }
    }

    // 先更新状态，避免通知失败导致状态不更新
    await storage.set("last_status", newStatus)

    // 如果有新开播的主播，发送合并通知
    if (newLiveStreamers.length > 0) {
      try {
        const title =
          newLiveStreamers.length === 1
            ? `${newLiveStreamers[0].streamerName} 开播了`
            : `${newLiveStreamers.length} 位主播开播了`

        const message =
          newLiveStreamers.length === 1
            ? newLiveStreamers[0].roomName
            : newLiveStreamers.map((room) => room.streamerName).join("、")

        // 保存最近开播的主播信息
        await storage.set("recent_live_streamers", newLiveStreamers)

        // 使用时间戳后6位作为唯一标识
        const timestamp = String(Date.now()).slice(-6)
        const notificationId = `live_${timestamp}_${newLiveStreamers[0].roomId}`
        await chrome.notifications.create(notificationId, {
          type: "basic",
          iconUrl: newLiveStreamers[0].avatar,
          title,
          message,
          priority: 2
        })
      } catch (error) {
        // 通知失败不影响状态更新，只记录错误
        handleError(error as Error)
      }
    }
  } catch (error) {
    handleError(error as Error)
  }
}

async function updateLiveCheck() {
  console.log("updateLiveCheck")
  try {
    const muteNotification = await storage.get<boolean>("mute_notification")
    const checkIntervalMinutes =
      (await storage.get<number>("check_interval")) || 3 // 默认3分钟

    // 清除现有的 alarm
    await chrome.alarms.clear(ALARM_NAME)
    console.log("muteNotification", muteNotification)
    if (!muteNotification) {
      // 立即执行一次检查
      await checkLiveStatus()

      // 创建新的 alarm
      chrome.alarms.create(ALARM_NAME, {
        periodInMinutes: checkIntervalMinutes
      })
    }
  } catch (error) {
    handleError(error as Error)
  }
}

// 获取 Twitch auth token
async function getTwitchAuthToken() {
  try {
    const urls = ["https://www.twitch.tv", "https://twitch.tv"]

    for (const url of urls) {
      const cookie = await chrome.cookies.get({
        url,
        name: "auth-token"
      })

      if (cookie) {
        return cookie.value
      }
    }
    return null
  } catch (error) {
    handleError(error as Error)
    return null
  }
}

// 监听 alarm 事件
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    checkLiveStatus().catch(handleError)
  }
})

// 监听存储变化
chrome.storage.onChanged.addListener((changes) => {
  // 当通知设置或检查间隔改变时更新检查
  if (changes.mute_notification || changes.check_interval) {
    updateLiveCheck().catch(handleError)
  }
})

// 监听通知点击
chrome.notifications.onClicked.addListener(async (notificationId) => {
  try {
    if (notificationId.startsWith("live_notification")) {
      const recentStreamers = await storage.get<any[]>("recent_live_streamers")
      if (recentStreamers && recentStreamers.length === 1) {
        // 单个主播开播时直接跳转到直播间
        chrome.tabs.create({ url: recentStreamers[0].url })
      } else {
        // 多个主播同时开播时跳转到扩展标签页
        chrome.tabs.create({
          url: `chrome-extension://${chrome.runtime.id}/tabs/index.html`
        })
      }
    }
  } catch (error) {
    handleError(error as Error)
  }
})

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CLOSE_CURRENT_TAB" && sender.tab) {
    chrome.tabs.remove(sender.tab.id)
  } else if (message.type === "GET_TWITCH_AUTH") {
    getTwitchAuthToken().then(sendResponse)
    return true // 保持消息通道开启，等待异步响应
  }
})

// 初始化
updateLiveCheck().catch(handleError)
