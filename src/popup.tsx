import { useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import { PlainRoom } from "~components/PlainRoom"
import type { Room } from "~types/Room"

import { biliFetch } from "./fetcher/bilibili"
import { dyFetch } from "./fetcher/douyu"

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

        const [dy, bili] = await Promise.allSettled([dyFetch(), biliFetch()])
        const res = []
        if (dy.status === "fulfilled") {
          res.push(...dy.value)
        } else {
          console.warn("获取斗鱼数据失败:", dy.reason)
        }
        if (bili.status === "fulfilled") {
          res.push(...bili.value)
        } else {
          console.warn("获取B站数据失败:", bili.reason)
        }
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
  const openedRooms = data.filter((v) => {
    const isHidden = hiddenList?.includes(v.roomId)
    return v.isOpen && !isHidden
  })
  if (isLoading) {
    return (
      <div className="flex flex-col p-2 w-72">
        <div>加载中...</div>
      </div>
    )
  }
  return (
    <div className="flex flex-col p-2 w-72">
      <div className="cursor-pointer text-sm font-bold flex-row flex ali">
        <input
          type="checkbox"
          checked={isRich}
          onChange={(e) => setIsRich(e.target.checked)}></input>
        <span onClick={(e) => setIsRich((v) => !v)}>显示预览</span>
      </div>
      <div className="flex flex-col gap-1 ">
        {openedRooms.map((item) => (
          <PlainRoom
            isRich={isRich}
            room={item}
            key={item.roomId}
            addToHidden={addToHidden}
          />
        ))}
      </div>
    </div>
  )
}

export default IndexPopup
