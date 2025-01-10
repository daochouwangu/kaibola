import type { PlasmoCSConfig } from "plasmo"

import { Storage } from "@plasmohq/storage"

export const config: PlasmoCSConfig = {
  matches: ["https://www.twitch.tv/*", "https://twitch.tv/*"]
}
const storage = new Storage()

async function getAuthToken() {
  try {
    console.log("开始获取 Twitch auth token...")

    // 检查 cookies API 是否可用
    if (!chrome.cookies) {
      console.error("chrome.cookies API 不可用")
      return null
    }

    // 尝试不同的域名组合
    const urls = ["https://www.twitch.tv", "https://twitch.tv"]

    for (const url of urls) {
      console.log(`尝试从 ${url} 获取 cookie...`)
      const cookie = await chrome.cookies.get({
        url,
        name: "auth-token"
      })

      if (cookie) {
        console.log(`成功从 ${url} 获取 auth token`)
        return cookie.value
      }
    }

    console.log("在所有域名中都未找到 auth-token cookie")
    return null
  } catch (error) {
    console.error("获取 auth token 失败:", error)
    // 输出更多调试信息
    console.log("chrome.runtime.lastError:", chrome.runtime.lastError)
    return null
  }
}

// 检查是否是从设置页面跳转来的
function isFromSettings() {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get("source") === "kaibola_auth"
}

// 检查是否是登录成功后的页面
function isPostLoginPage() {
  return (
    window.location.pathname === "/" &&
    window.location.search.includes("no-reload=true")
  )
}

// 注入到 twitch.tv 页面获取认证信息
async function injectScript() {
  // 如果不是登录成功页面且不是来自设置页面，则不执行
  if (!isPostLoginPage() && !isFromSettings()) {
    return
  }

  const authToken = await getAuthToken()
  if (authToken) {
    window.postMessage(
      {
        type: "TWITCH_AUTH_DATA",
        data: {
          authToken
        }
      },
      "*"
    )
  } else {
    window.postMessage(
      {
        type: "TWITCH_AUTH_ERROR",
        error: "未找到认证信息，请先登录 Twitch"
      },
      "*"
    )
  }
}

// 监听页面消息
window.addEventListener("message", async (event) => {
  // 只在从设置页面跳转来的情况下关闭标签页
  const shouldCloseTab = isFromSettings()

  if (event.data.type === "TWITCH_AUTH_DATA") {
    const { authToken } = event.data.data
    if (authToken) {
      await storage.set("twitch_config", {
        authToken
      })
      // 只有从设置页面来的才自动关闭
      if (shouldCloseTab) {
        chrome.runtime.sendMessage({ type: "CLOSE_CURRENT_TAB" })
      }
    }
  } else if (event.data.type === "TWITCH_AUTH_ERROR") {
    console.error("Twitch auth error:", event.data.error)
  }
})

// 执行注入
injectScript()
