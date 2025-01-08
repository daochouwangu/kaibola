import type { Room } from "~types/Room"

interface PlainRoomProps {
  room: Room
  isRich: boolean
  addToHidden: (id: string) => void
  isHidden?: boolean
  onUnhide?: () => void
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
  addToHidden,
  isHidden,
  onUnhide
}) => {
  const onClickHidden = (e: React.MouseEvent) => {
    e.stopPropagation()
    addToHidden(room.roomId)
  }

  const toRoom = () => {
    window.open(room.url, "_blank")
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-lg bg-white border border-gray-200 
      shadow-sm hover:shadow-md transition-all cursor-pointer 
      ${isHidden ? "bg-gray-50" : "hover:border-blue-200"}`}
      onClick={toRoom}>
      {isRich && (
        <div className="relative aspect-video w-full overflow-hidden">
          <img
            src={room.cover}
            alt={room.roomName}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute left-2 top-2 flex gap-1">
            <span className="rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
              {room.platform}
            </span>
            {room.areaName && (
              <span className="rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                {room.areaName}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="p-3">
        <div className="mb-1.5 flex items-center gap-2">
          <img
            src={room.avatar}
            alt={room.streamerName}
            className="h-8 w-8 rounded-full ring-1 ring-gray-200"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold truncate text-gray-900">
              {room.streamerName}
            </h3>
            <p className="text-xs text-gray-600 truncate">
              {shortName(room.roomName, 15)}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (isHidden && onUnhide) {
                onUnhide()
              } else {
                addToHidden(room.roomId)
              }
            }}
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs transition-colors
            ${
              isHidden
                ? "bg-blue-50 hover:bg-blue-100 text-blue-600"
                : "bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900"
            }`}>
            {isHidden ? "取消隐藏" : "隐藏"}
          </button>
        </div>

        {room.showTime && (
          <div className="text-xs text-gray-500">{showTime(room.showTime)}</div>
        )}
      </div>
    </div>
  )
}
