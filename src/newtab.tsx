import { useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import { PlainRoom } from "~components/PlainRoom"
import type { Room } from "~types/Room"

import { biliFetch } from "./fetcher/bilibili"
import { dyFetch } from "./fetcher/douyu"

import "./style.css"
import "./main.css"

import { RichRoom } from "~components/RichRoom"

const storage = new Storage({
  area: "local",
  allCopied: true
})

function IndexNewtab() {
  const [data, setData] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hiddenList, setHiddenList] = useStorage({
    key: "hiddenList",
    instance: storage
  })

  useEffect(() => {
    if (hiddenList === undefined) setHiddenList([])
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
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

  const addToHidden = (id: string) => {
    setHiddenList([...hiddenList, id])
  }

  const openedRooms = data.filter(
    (v) => v.isOpen && !hiddenList?.includes(v.roomId)
  )

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {openedRooms.map((item) => (
          <RichRoom room={item} key={item.roomId} addToHidden={addToHidden} />
        ))}
      </div>
    </div>
  )
}

export default IndexNewtab
