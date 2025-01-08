import { useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import { LoginAlert } from "~components/LoginAlert"
import { PlainRoom } from "~components/PlainRoom"
import { NotLoginError } from "~types/errors"
import type { Room } from "~types/Room"

import { biliFetch } from "./fetcher/bilibili"
import { dyFetch } from "./fetcher/douyu"
import { hyFetch } from "./fetcher/huya"

import "./main.css"

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
  const [enableNotification, setEnableNotification] = useStorage<boolean>({
    key: "enable_notification",
    instance: storage
  })

  const hiddenLiveCount = data.filter(
    (room) => room.isOpen && hiddenList?.includes(room.roomId)
  ).length

  const visibleRooms = data.filter((v) => {
    const isHidden = hiddenList?.includes(v.roomId)
    return v.isOpen && (showHidden || !isHidden)
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
  const clear = () => {
    setHiddenList([])
  }
  if (isLoading) {
    return (
      <div className="flex flex-col p-2 w-72">
        <div>加载中...</div>
      </div>
    )
  }
  return (
    <div className="flex flex-col p-2 w-72">
      {loginErrors.map((error, index) => (
        <LoginAlert
          key={index}
          platform={error.platform}
          loginUrl={error.loginUrl}
        />
      ))}
      <div className="flex justify-between items-center mb-2">
        <button
          onClick={(e) => setIsRich((v) => !v)}
          className="text-sm px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={isRich}
            onChange={(e) => setIsRich(e.target.checked)}
            className="cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
          <span>显示预览</span>
        </button>
        {hiddenLiveCount > 0 && (
          <button
            onClick={() => setShowHidden(!showHidden)}
            className="text-sm px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">
            {showHidden ? "隐藏已屏蔽" : `显示全部(${hiddenLiveCount})`}
          </button>
        )}
        <button
          onClick={(e) => setEnableNotification((v) => !v)}
          className="text-sm px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={enableNotification}
            onChange={(e) => setEnableNotification(e.target.checked)}
            className="cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
          <span>开播提醒</span>
        </button>
      </div>
      <div className="flex flex-col gap-1">
        {visibleRooms.map((item) => (
          <PlainRoom
            isRich={isRich}
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
