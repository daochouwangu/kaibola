import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import "./main.css"

const storage = new Storage({
  area: "sync",
  allCopied: true
})

function IndexOptions() {
  const [replaceNewTab, setReplaceNewTab] = useStorage<boolean>({
    key: "replace_new_tab",
    instance: storage
  })
  const [enableNotification, setEnableNotification] = useStorage<boolean>({
    key: "enable_notification",
    instance: storage
  })

  const handleChange = async (checked: boolean) => {
    await setReplaceNewTab(checked)
    // 需要重新加载扩展使设置生效
    chrome.runtime.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold text-gray-900">设置</h1>

        <div className="space-y-6 rounded-lg bg-white p-6 shadow">
          {/* 新标签页设置 */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={replaceNewTab}
                  onChange={(e) => handleChange(e.target.checked)}
                  id="replace-new-tab"
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label
                  htmlFor="replace-new-tab"
                  className="font-medium text-gray-900">
                  将新标签页替换为直播间列表
                </label>
              </div>
              <p className="mt-1 text-sm text-gray-500 ml-6">
                注意：修改此设置后扩展会自动重新加载以生效
              </p>
            </div>
          </div>

          <div className="h-px bg-gray-200" />

          {/* 开播提醒设置 */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enableNotification}
                  onChange={(e) => setEnableNotification(e.target.checked)}
                  id="enable-notification"
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label
                  htmlFor="enable-notification"
                  className="font-medium text-gray-900">
                  开播提醒
                </label>
              </div>
              <p className="mt-1 text-sm text-gray-500 ml-6">
                当关注的主播开播时发送系统通知
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IndexOptions
