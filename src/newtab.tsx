import { useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import { PlainRoom } from "~components/PlainRoom"
import type { Room } from "~types/Room"

import { biliFetch } from "./fetcher/bilibili"
import { dyFetch } from "./fetcher/douyu"

import "./style.css"
import "./main.css"

import { HiddenRooms } from "~components/HiddenRooms"
import { LoginAlert } from "~components/LoginAlert"
import { RichRoom } from "~components/RichRoom"
import { hyFetch } from "~fetcher/huya"
import { NotLoginError } from "~types/errors"

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

        const [dy, bili, hy] = await Promise.allSettled([
          dyFetch(),
          biliFetch(),
          hyFetch()
        ])
        const res = []
        const errors: NotLoginError[] = []

        if (dy.status === "fulfilled") {
          res.push(...dy.value)
        } else {
          if (dy.reason instanceof NotLoginError) {
            errors.push(dy.reason)
          } else {
            console.warn("获取斗鱼数据失败:", dy.reason)
          }
        }
        if (bili.status === "fulfilled") {
          res.push(...bili.value)
        } else {
          if (bili.reason instanceof NotLoginError) {
            errors.push(bili.reason)
          } else {
            console.warn("获取B站数据失败:", bili.reason)
          }
        }
        if (hy.status === "fulfilled") {
          res.push(...hy.value)
        } else {
          if (hy.reason instanceof NotLoginError) {
            errors.push(hy.reason)
          } else {
            console.warn("获取虎牙数据失败:", hy.reason)
          }
        }
        setLoginErrors(errors)
        setData(res)
      } catch (error) {
        console.error("获取数据失败:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const openedRooms = data.filter((v) => {
    const isHidden = hiddenList?.includes(v.roomId)
    return v.isOpen && !isHidden
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

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={enableNotification}
            onChange={(e) => setEnableNotification(e.target.checked)}
            id="enable-notification-newtab"
            className="cursor-pointer"
          />
          <label
            htmlFor="enable-notification-newtab"
            className="cursor-pointer">
            开播提醒
          </label>
        </div>
      </div>

      {hiddenRooms.length > 0 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowHidden(true)}
            className="px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            管理隐藏直播间
            {hiddenLiveCount > 0 && (
              <span className="ml-1 text-gray-500">({hiddenLiveCount})</span>
            )}
          </button>
        </div>
      )}

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
