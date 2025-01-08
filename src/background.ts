import { Storage } from "@plasmohq/storage"

import type { Room } from "~types/Room"

import { biliFetch } from "./fetcher/bilibili"
import { dyFetch } from "./fetcher/douyu"
import { hyFetch } from "./fetcher/huya"

const storage = new Storage({
  area: "sync",
  allCopied: true
})

let lastRooms: Room[] = []
let checkInterval: NodeJS.Timeout | null = null

// 检查直播状态变化
async function checkLiveStatus() {
  try {
    console.log("开始检查直播状态...")
    const [dy, bili, hy] = await Promise.allSettled([
      dyFetch(),
      biliFetch(),
      hyFetch()
    ])

    const currentRooms: Room[] = []

    // 合并所有平台的结果
    if (dy.status === "fulfilled") currentRooms.push(...dy.value)
    if (bili.status === "fulfilled") currentRooms.push(...bili.value)
    if (hy.status === "fulfilled") currentRooms.push(...hy.value)

    console.log("当前在线房间:", currentRooms.length)
    console.log("上次在线房间:", lastRooms.length)

    // 找出新开播的房间
    const newLiveRooms = currentRooms.filter((room) => {
      const wasLive = lastRooms.find((r) => r.roomId === room.roomId)?.isOpen
      return room.isOpen && !wasLive
    })

    console.log("新开播房间:", newLiveRooms.length)

    // 如果有新开播的房间
    if (newLiveRooms.length > 0) {
      const firstRoom = newLiveRooms[0]

      // 生成通知标题和消息
      let title = ""
      let message = ""

      if (newLiveRooms.length === 1) {
        title = `${firstRoom.streamerName} 开播了!`
        message = firstRoom.roomName
      } else {
        const otherCount = newLiveRooms.length - 1
        title = `${firstRoom.streamerName} 等 ${newLiveRooms.length} 个主播开播了!`
        message = newLiveRooms
          .map((room) => `${room.streamerName}(${room.platform})`)
          .join("\n")
      }

      console.log("发送合并通知:", title)
      // 创建一个合并的通知
      chrome.notifications.create(`live-${firstRoom.roomId}`, {
        type: "basic",
        iconUrl: firstRoom.avatar,
        title,
        message
      })
    }

    lastRooms = currentRooms
  } catch (error) {
    console.error("检查直播状态失败:", error)
  }
}

// 处理通知点击事件
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId.startsWith("live-")) {
    const roomId = notificationId.replace("live-", "")
    const room = lastRooms.find((r) => r.roomId === roomId)
    if (room) {
      chrome.tabs.create({ url: room.url })
    }
  }
})

// 启动/停止检查
async function updateLiveCheck() {
  const enableNotification = await storage.get<boolean>("enable_notification")

  if (checkInterval) {
    clearInterval(checkInterval)
    checkInterval = null
  }

  if (enableNotification) {
    // 请求通知权限
    const permission = await chrome.permissions.request({
      permissions: ["notifications"]
    })

    if (permission) {
      await checkLiveStatus() // 立即执行一次
      checkInterval = setInterval(checkLiveStatus, 3 * 60 * 1000) // 每3分钟检查一次
    }
  }
}

// 监听扩展安装或更新
chrome.runtime.onInstalled.addListener(async () => {
  await updateNewTabOverride()
  await updateLiveCheck()
})

// 监听存储变化
chrome.storage.onChanged.addListener(async (changes) => {
  if (changes.replace_new_tab) {
    await updateNewTabOverride()
  }
  if (changes.enable_notification) {
    await updateLiveCheck()
  }
})

async function updateNewTabOverride() {
  const replaceNewTab = await storage.get<boolean>("replace_new_tab")

  if (replaceNewTab) {
    // 启用新标签页替换
    await chrome.action.setIcon({ path: "/assets/icon.png" })
    chrome.tabs.create({ url: chrome.runtime.getURL("newtab.html") })
  }
}
