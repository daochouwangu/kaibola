import type { Room } from "~types/Room"

interface PlainRoomProps {
  room: Room
  isRich: boolean
  addToHidden: (id: string) => void
}
function showTime(n: string) {
  if (!n) {
    return ""
  }
  const t = (Date.now() - Number(n) * 1000) / 60000
  const i = Math.floor(t % 60)
  const s = Math.floor(t / 60)
  return `已播${s}时${i}分`
}
function shortName(n: string, len = 20) {
  return n.length > len ? n.slice(0, len) + "..." : n
}
export const PlainRoom: React.FC<PlainRoomProps> = ({
  room,
  isRich,
  addToHidden
}) => {
  const onClickHidden = (e) => {
    e.stopPropagation()
    addToHidden(room.roomId)
  }
  const toRoom = () => {
    window.open(room.url, "_blank")
  }
  return (
    <div
      className="w-full flex flex-col p-2 flex-nowrap border rounded"
      onClick={toRoom}>
      {isRich && <img src={room.cover}></img>}
      <div className=" font-bold text-base">{shortName(room.roomName)}</div>
      <div className="flex flex-row flex-nowrap justify-between">
        <div className=" text-xs">{room.streamerName}</div>
        {room.showTime && <div>{showTime(room.showTime)}</div>}
        <div onClick={onClickHidden}>Hide</div>
      </div>
    </div>
  )
}
