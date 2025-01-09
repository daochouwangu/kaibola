import { useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import type { Room } from "~types/Room"

import "./style.css"
import "./main.css"

import { HiddenRooms } from "~components/HiddenRooms"
import { LoginAlert } from "~components/LoginAlert"
import { PlatformTabs } from "~components/PlatformTabs"
import { RichRoom } from "~components/RichRoom"
import { NotLoginError } from "~types/errors"
import type { Platform } from "~types/platform"
import { fetchRoomData, getEnabledPlatforms } from "~utils/platforms"

const storage = new Storage({
  area: "sync",
  allCopied: true
})

function IndexNewtab() {
  const [data, setData] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hiddenList, setHiddenList] = useStorage<string[]>({
    key: "hidden_rooms",
    instance: storage
  })
  const [showHidden, setShowHidden] = useState(false)
  const [loginErrors, setLoginErrors] = useState<NotLoginError[]>([])
  const [enableNotification, setEnableNotification] = useStorage<boolean>({
    key: "enable_notification",
    instance: storage
  })
  const [enabledPlatforms, setEnabledPlatforms] = useState<Platform[]>([])
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(
    null
  )

  const addToHidden = async (id: string) => {
    const currentList = (await storage.get<string[]>("hidden_rooms")) || []

    const newList = [...currentList, id]

    await storage.set("hidden_rooms", newList)
    setHiddenList(newList)
  }

  const removeFromHidden = async (id: string) => {
    const currentList = (await storage.get<string[]>("hidden_rooms")) || []
    const newList = currentList.filter((roomId) => roomId !== id)
    await storage.set("hidden_rooms", newList)
    setHiddenList(newList)
  }

  const hiddenRooms = data.filter((room) => hiddenList?.includes(room.roomId))
  const hiddenLiveCount = hiddenRooms.filter((room) => room.isOpen).length

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

  const openedRooms = data.filter((v) => {
    const isHidden = hiddenList?.includes(v.roomId)
    const matchPlatform = selectedPlatform
      ? v.platform === selectedPlatform
      : true
    return v.isOpen && !isHidden && matchPlatform
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="mb-4 space-y-2">
        {loginErrors.map((error, index) => (
          <LoginAlert
            key={index}
            platform={error.platform}
            loginUrl={error.loginUrl}
          />
        ))}

        <div className="flex justify-end items-center gap-2">
          <button
            onClick={() => chrome.runtime.openOptionsPage()}
            className="px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            title="设置">
            <svg
              className="w-5 h-5"
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
            onClick={(e) => setEnableNotification((v) => !v)}
            className="px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow flex items-center gap-2">
            <input
              type="checkbox"
              checked={enableNotification}
              onChange={(e) => setEnableNotification(e.target.checked)}
              id="enable-notification-newtab"
              className="cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
            <span>开播提醒</span>
          </button>

          {hiddenRooms.length > 0 && (
            <button
              onClick={() => setShowHidden(true)}
              className="px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              管理隐藏直播间
              {hiddenLiveCount > 0 && (
                <span className="ml-1 text-gray-500">({hiddenLiveCount})</span>
              )}
            </button>
          )}
        </div>
      </div>

      <PlatformTabs
        platforms={enabledPlatforms}
        selectedPlatform={selectedPlatform}
        onSelect={setSelectedPlatform}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {openedRooms.map((item) => (
          <RichRoom room={item} key={item.roomId} addToHidden={addToHidden} />
        ))}
      </div>

      {showHidden && (
        <HiddenRooms
          rooms={hiddenRooms}
          onUnhide={removeFromHidden}
          onClose={() => setShowHidden(false)}
        />
      )}
    </div>
  )
}

export default IndexNewtab
