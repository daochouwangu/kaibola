import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

const storage = new Storage({
  area: "sync",
  allCopied: true
})

function IndexOptions() {
  const [replaceNewTab, setReplaceNewTab] = useStorage<boolean>({
    key: "replace_new_tab",
    instance: storage
  })

  const handleChange = async (checked: boolean) => {
    await setReplaceNewTab(checked)
    // 需要重新加载扩展使设置生效
    chrome.runtime.reload()
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={replaceNewTab}
          onChange={(e) => handleChange(e.target.checked)}
          id="replace-new-tab"
        />
        <label htmlFor="replace-new-tab">将新标签页替换为直播间列表</label>
      </div>
      <p className="mt-2 text-sm text-gray-500">
        注意：修改此设置后扩展会自动重新加载以生效
      </p>
    </div>
  )
}

export default IndexOptions
