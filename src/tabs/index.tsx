import { useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import type { Room } from "~types/Room"

import "../style.css"
import "../main.css"

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

function TabsPage() {
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
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

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

  const refreshData = async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    try {
      const { rooms, errors } = await fetchRoomData()
      setLoginErrors(errors)
      setData(rooms)
    } catch (error) {
      console.error("获取数据失败:", error)
    } finally {
      setIsRefreshing(false)
    }
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

  const openedRooms = data
    .filter((v) => {
      const matchPlatform = selectedPlatform
        ? v.platform === selectedPlatform
        : true
      const matchSearch = searchQuery
        ? v.roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.streamerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (v.areaName &&
            v.areaName.toLowerCase().includes(searchQuery.toLowerCase()))
        : true
      return v.isOpen && matchPlatform && matchSearch
    })
    .sort((a, b) => {
      const aHidden = hiddenList?.includes(a.roomId) ?? false
      const bHidden = hiddenList?.includes(b.roomId) ?? false
      if (aHidden === bHidden) return 0
      return aHidden ? 1 : -1
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
            onClick={(e) => setMuteNotification((v) => !v)}
            className="px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow flex items-center gap-2"
            title={muteNotification ? "提醒已关闭" : "提醒已开启"}>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke={muteNotification ? "currentColor" : "#3B82F6"}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span
              className={muteNotification ? "text-gray-600" : "text-blue-600"}>
              {muteNotification ? "提醒已关闭" : "提醒已开启"}
            </span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={refreshData}
          disabled={isRefreshing}
          className={`p-1.5 rounded-full bg-white shadow hover:shadow-md transition-shadow ${
            isRefreshing ? "opacity-50" : ""
          }`}
          title="刷新">
          <svg
            className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
        <PlatformTabs
          platforms={enabledPlatforms}
          selectedPlatform={selectedPlatform}
          onSelect={setSelectedPlatform}
        />
        <div className="flex-1" />
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索直播间/主播/游戏"
            className="w-64 px-4 py-2 pr-10 rounded-lg border border-gray-200 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {openedRooms.map((item) => (
          <RichRoom
            room={item}
            key={item.roomId}
            addToHidden={addToHidden}
            hiddenList={hiddenList}
            onUnhide={removeFromHidden}
          />
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

export default TabsPage
