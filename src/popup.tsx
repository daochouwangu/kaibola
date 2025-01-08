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
  area: "local",
  allCopied: true
})
function IndexPopup() {
  const [isRich, setIsRich] = useStorage<boolean>({
    key: "isRich",
    instance: storage
  })
  const [data, setData] = useState([] as Room[])
  const [showAll, setShowAll] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hiddenList, setHiddenList] = useStorage<string[]>({
    key: "hiddenList",
    instance: storage
  })
  if (hiddenList === null || hiddenList === undefined) {
    setHiddenList([])
  }
  window.test = () => {
    fetch("https://www.youtube.com/feed/subscriptions")
      .then((res) => res.text())
      .then(console.log)
  }
  useEffect(() => {
    Promise.allSettled([dyFetch(), biliFetch()]).then(([dy, bili]) => {
      const res = []
      if (dy.status === "fulfilled") {
        res.push(...dy.value)
      }
      if (bili.status === "fulfilled") {
        res.push(...bili.value)
      }
      setData(res)
      setIsLoading(false)
    })
  }, [])
  const addToHidden = (id: string) => {
    setHiddenList([...hiddenList, id])
  }
  const [openedRooms, setOpenedRooms] = useState([] as Room[])
  useEffect(() => {
    const openedRooms = data
      .filter((v) => v.isOpen)
      .filter((v) => {
        if (hiddenList === null || hiddenList === undefined) {
          return true
        }
        return !hiddenList.includes(v.roomId)
      })
    setOpenedRooms(openedRooms)
  }, [data, hiddenList])
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
      <div className=" cursor-pointer text-sm font-bold flex-row flex ali">
        <input
          type="checkbox"
          checked={isRich}
          onChange={(e) => setIsRich(e.target.checked)}></input>
        <span onClick={(e) => setIsRich((v) => !v)}>显示预览</span>
      </div>
      <div className="flex flex-col gap-1 ">
        {showAll
          ? data.map((item) => (
              <PlainRoom
                isRich={isRich}
                room={item}
                key={item.roomId}
                addToHidden={addToHidden}
              />
            ))
          : openedRooms.map((item) => (
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
