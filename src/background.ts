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
    const enableNotification = await storage.get<boolean>("enable_notification")
    if (!enableNotification) return

    const { rooms } = await fetchRoomData()
    const lastStatus = await storage.get<Record<string, boolean>>("last_status")
    const newStatus: Record<string, boolean> = {}
    console.log(lastStatus)
    for (const room of rooms) {
      newStatus[room.roomId] = room.isOpen
      if (lastStatus && !lastStatus[room.roomId] && room.isOpen) {
        try {
          await chrome.notifications.create(room.roomId, {
            type: "basic",
            iconUrl: room.avatar,
            title: `${room.streamerName} 开播了`,
            message: room.roomName,
            priority: 2
          })
        } catch (error) {
          handleError(error as Error)
          return
        }
      }
    }

    await storage.set("last_status", newStatus)
  } catch (error) {
    handleError(error as Error)
  }
}

async function updateLiveCheck() {
  console.log("updateLiveCheck")
  try {
    const enableNotification = await storage.get<boolean>("enable_notification")
    const checkIntervalMinutes =
      (await storage.get<number>("check_interval")) || 3 // 默认3分钟

    // 清除现有的 alarm
    await chrome.alarms.clear(ALARM_NAME)

    if (enableNotification) {
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

// 监听 alarm 事件
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    checkLiveStatus().catch(handleError)
  }
})

// 监听存储变化
chrome.storage.onChanged.addListener((changes) => {
  // 当通知设置或检查间隔改变时更新检查
  if (changes.enable_notification || changes.check_interval) {
    updateLiveCheck().catch(handleError)
  }
})

// 监听通知点击
chrome.notifications.onClicked.addListener((roomId) => {
  try {
    chrome.tabs
      .create({
        url: `chrome-extension://${chrome.runtime.id}/newtab.html`
      })
      .catch(handleError)
  } catch (error) {
    handleError(error as Error)
  }
})

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "CLOSE_CURRENT_TAB" && sender.tab) {
    chrome.tabs.remove(sender.tab.id)
  }
})

// 初始化
updateLiveCheck().catch(handleError)
