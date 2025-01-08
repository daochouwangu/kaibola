import { Storage } from "@plasmohq/storage"

const storage = new Storage({
  area: "sync",
  allCopied: true
})

// 监听扩展安装或更新
chrome.runtime.onInstalled.addListener(async () => {
  await updateNewTabOverride()
})

// 监听存储变化
chrome.storage.onChanged.addListener(async (changes) => {
  if (changes.replace_new_tab) {
    await updateNewTabOverride()
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
