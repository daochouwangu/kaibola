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

        // 获取并更新最近开播主播信息
        const recentData = await storage.get<{
          rooms: Record<string, { platform: string; url: string }>
          timestamp: number
        }>("recent_live_streamers")

        const currentTime = Date.now()
        // 如果存在未过期的数据（6小时内），则合并
        const mergedRooms =
          !recentData || currentTime - recentData.timestamp > 6 * 60 * 60 * 1000
            ? newLiveStreamers.reduce(
                (acc, room) => ({
                  ...acc,
                  [`${room.platform}_${room.roomId}`]: {
                    platform: room.platform,
                    url: room.url
                  }
                }),
                {}
              )
            : {
                ...recentData.rooms,
                ...newLiveStreamers.reduce(
                  (acc, room) => ({
                    ...acc,
                    [`${room.platform}_${room.roomId}`]: {
                      platform: room.platform,
                      url: room.url
                    }
                  }),
                  {}
                )
              }

        // 存储合并后的开播主播信息
        await storage.set("recent_live_streamers", {
          rooms: mergedRooms,
          timestamp: currentTime
        })

        const notificationId =
          newLiveStreamers.length === 1
            ? `live_${newLiveStreamers[0].platform}_${newLiveStreamers[0].roomId}`
            : `live_multiple`

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
  try {
    const muteNotification = await storage.get<boolean>("mute_notification")
    const checkIntervalMinutes =
      (await storage.get<number>("check_interval")) || 3 // 默认3分钟

    // 清除现有的 alarm
    await chrome.alarms.clear(ALARM_NAME)
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
    console.log("通知被点击:", notificationId)
    if (notificationId.startsWith("live_")) {
      const recentData = await storage.get<{
        rooms: Record<string, { platform: string; url: string }>
        timestamp: number
      }>("recent_live_streamers")

      console.log("获取到的存储数据:", recentData)

      const currentTime = Date.now()
      // 检查数据是否存在且未过期（6小时）
      const isExpired =
        !recentData || currentTime - recentData.timestamp > 6 * 60 * 60 * 1000
      console.log("数据是否过期:", isExpired)

      // 插件标签页 URL
      const extensionTabUrl = `chrome-extension://${chrome.runtime.id}/tabs/index.html`

      if (notificationId === "live_multiple") {
        console.log("多人开播通知，跳转到标签页")
        chrome.tabs.create({ url: extensionTabUrl })
      } else {
        // 单个主播开播，从通知ID解析平台和房间ID
        const parts = notificationId.replace("live_", "").split("_")
        // 第一个部分是平台，剩余部分组合成房间ID
        const platform = parts[0]
        const roomId = parts.slice(1).join("_")
        const roomKey = `${platform}_${roomId}`
        console.log("解析的房间信息:", { platform, roomId, roomKey })

        let shouldRedirectToExtension = true

        try {
          // 如果存储的数据已过期，则重新获取
          if (isExpired) {
            console.log("数据已过期，重新获取")
            const { rooms } = await fetchRoomData()
            console.log("重新获取的房间数据:", rooms)
            const room = rooms.find(
              (r) => r.platform === platform && r.roomId === roomId
            )
            console.log("找到的房间:", room)
            if (room?.url) {
              console.log("跳转到直播间:", room.url)
              await chrome.tabs.create({ url: room.url })
              shouldRedirectToExtension = false
            }
          } else {
            // 使用存储的数据
            const room = recentData.rooms[roomKey]
            console.log("从存储中找到的房间:", room)
            if (room?.url) {
              console.log("跳转到直播间:", room.url)
              await chrome.tabs.create({ url: room.url })
              shouldRedirectToExtension = false
            }
          }
        } catch (error) {
          console.error("跳转直播间时出错:", error)
          shouldRedirectToExtension = true
        }

        // 如果没有找到房间信息，跳转到插件标签页
        if (shouldRedirectToExtension) {
          console.log("未找到房间信息或出错，跳转到标签页")
          chrome.tabs.create({ url: extensionTabUrl })
        }
      }
    }
  } catch (error) {
    console.error("处理通知点击时出错:", error)
    handleError(error as Error)
    // 发生错误时也跳转到插件标签页
    chrome.tabs.create({
      url: `chrome-extension://${chrome.runtime.id}/tabs/index.html`
    })
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
