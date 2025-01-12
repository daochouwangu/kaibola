import { useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import { LoginAlert } from "~components/LoginAlert"
import { PlainRoom } from "~components/PlainRoom"
import { PlatformTabs } from "~components/PlatformTabs"
import { NotLoginError } from "~types/errors"
import type { Platform } from "~types/platform"
import type { Room } from "~types/Room"
import { getEnabledPlatforms } from "~utils/platforms"

import "./main.css"

import { Toast } from "~components/Toast"
import { fetchRoomData } from "~utils/platforms"

declare global {
  interface Window {
    test: any
  }
}
const storage = new Storage({
  area: "sync",
  allCopied: true
})
function IndexPopup() {
  const [isRich, setIsRich] = useStorage<boolean>({
    key: "isRich",
    instance: storage
  })
  const [data, setData] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hiddenList, setHiddenList] = useStorage<string[]>({
    key: "hidden_rooms",
    instance: storage
  })
  const [showHidden, setShowHidden] = useState(false)
  const [loginErrors, setLoginErrors] = useState<NotLoginError[]>([])
  const [muteNotification, setMuteNotification] = useStorage<boolean>({
    key: "mute_notification",
    instance: storage
  })
  const [enabledPlatforms, setEnabledPlatforms] = useState<Platform[]>([])
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(
    null
  )
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")

  const hiddenLiveCount = data.filter(
    (room) => room.isOpen && hiddenList?.includes(room.roomId)
  ).length

  const visibleRooms = data.filter((v) => {
    const isHidden = hiddenList?.includes(v.roomId)
    const matchPlatform = selectedPlatform
      ? v.platform === selectedPlatform
      : true
    return v.isOpen && matchPlatform && (showHidden ? isHidden : !isHidden)
  })

  window.test = () => {
    fetch("https://www.youtube.com/feed/subscriptions")
      .then((res) => res.text())
      .then(console.log)
  }
  const addToHidden = async (id: string) => {
    const currentList = (await storage.get<string[]>("hidden_rooms")) || []
    const newList = [...currentList, id]
    await storage.set("hidden_rooms", newList)
    setHiddenList(newList)
  }
  useEffect(() => {
    const fetchData = async () => {
      try {
        const savedHiddenList = await storage.get<string[]>("hidden_rooms")
        if (savedHiddenList) {
          setHiddenList(savedHiddenList)
        }

        const { rooms, errors } = await fetchRoomData()
        setLoginErrors(errors)
        setData(rooms)
      } catch (error) {
        console.error("获取数据失败:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])
  useEffect(() => {
    const loadPlatforms = async () => {
      const platforms = await getEnabledPlatforms()
      setEnabledPlatforms(platforms)
    }
    loadPlatforms()
  }, [])
  const clear = () => {
    setHiddenList([])
  }
  const openNewTab = () => {
    chrome.tabs.create({ url: "tabs/index.html" })
  }
  const handleNotificationToggle = (value: boolean) => {
    setMuteNotification(!value)
    setToastMessage(value ? "已关闭直播提醒" : "已开启直播提醒")
    setShowToast(true)
  }
  if (isLoading) {
    return (
      <div className="flex flex-col p-2 w-80">
        <div>加载中...</div>
      </div>
    )
  }
  const actualIsRich = isRich || false
  const actualMuteNotification = muteNotification ?? false
  return (
    <div className="flex flex-col p-2 w-80">
      {loginErrors.map((error, index) => (
        <LoginAlert
          key={index}
          platform={error.platform}
          loginUrl={error.loginUrl}
        />
      ))}
      {showToast && (
        <Toast message={toastMessage} onClose={() => setShowToast(false)} />
      )}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => setIsRich((v) => !v)}
            className={`text-sm px-2 py-1 rounded transition-colors ${
              actualIsRich
                ? "bg-blue-100 hover:bg-blue-200 text-blue-700"
                : "bg-gray-100 hover:bg-gray-200"
            }`}>
            封面
          </button>
        </div>

        <div className="flex items-center gap-2">
          {hiddenLiveCount > 0 && (
            <button
              onClick={() => setShowHidden(!showHidden)}
              className={`text-sm px-2 py-1 rounded transition-colors bg-gray-100 hover:bg-gray-200
              }`}>
              {showHidden ? "未隐藏" : `已隐藏(${hiddenLiveCount})`}
            </button>
          )}
          <button
            onClick={(e) => handleNotificationToggle(actualMuteNotification)}
            className={`text-sm p-1.5 rounded transition-colors ${
              actualMuteNotification
                ? "bg-gray-100 hover:bg-gray-200"
                : "bg-blue-100 hover:bg-blue-200"
            }`}
            title={actualMuteNotification ? "开启提醒" : "关闭提醒"}>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke={actualMuteNotification ? "currentColor" : "#3B82F6"}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>
          <button
            onClick={() => chrome.runtime.openOptionsPage()}
            className="text-sm p-1.5 rounded bg-gray-100 hover:bg-gray-200"
            title="设置">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
          <button
            onClick={openNewTab}
            className="text-sm p-1.5 rounded bg-gray-100 hover:bg-gray-200"
            title="在新标签页中打开">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
              />
            </svg>
          </button>
        </div>
      </div>
      <PlatformTabs
        platforms={enabledPlatforms}
        selectedPlatform={selectedPlatform}
        onSelect={setSelectedPlatform}
      />
      <div className="flex flex-col gap-1 mt-2">
        {visibleRooms.map((item) => (
          <PlainRoom
            isRich={actualIsRich}
            room={item}
            key={item.roomId}
            addToHidden={addToHidden}
            isHidden={hiddenList?.includes(item.roomId)}
            onUnhide={
              showHidden
                ? () => {
                    const newList = hiddenList.filter(
                      (id) => id !== item.roomId
                    )
                    setHiddenList(newList)
                  }
                : undefined
            }
          />
        ))}
      </div>
    </div>
  )
}

export default IndexPopup
