import type { Room } from "~types/Room"

interface RichRoomProps {
  room: Room
  addToHidden: (id: string) => void
  hiddenList?: string[]
  onUnhide?: (id: string) => void
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

export function RichRoom({
  room,
  addToHidden,
  hiddenList = [],
  onUnhide
}: RichRoomProps) {
  const isHidden = hiddenList.includes(room.roomId)

  const onClickButton = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isHidden && onUnhide) {
      onUnhide(room.roomId)
    } else {
      addToHidden(room.roomId)
    }
  }

  return (
    <div className="animate-fade-in-down bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden">
      <div className="relative">
        <a
          href={room.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block">
          {/* 封面图片 */}
          <div className="relative aspect-video w-full overflow-hidden">
            <img
              src={room.cover}
              alt={room.roomName}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
            {/* 平台标识和分区 */}
            <div className="absolute left-2 top-2 flex gap-1">
              <span className="rounded bg-black/50 px-1.5 py-0.5 text-xs text-white">
                {room.platform}
              </span>
              {room.areaName && (
                <span className="rounded bg-black/50 px-1.5 py-0.5 text-xs text-white">
                  {room.areaName}
                </span>
              )}
            </div>
          </div>

          {/* 主播信息 */}
          <div className="p-3">
            <div className="mb-1.5 flex items-center gap-2">
              <img
                src={room.avatar}
                alt={room.streamerName}
                className="h-8 w-8 rounded-full"
              />
              <div>
                <h3 className="text-sm font-bold">{room.streamerName}</h3>
                <p className="text-xs text-gray-600">
                  {shortName(room.roomName, 15)}
                </p>
              </div>
            </div>

            {/* 播放时间 */}
            <div className="mt-1.5 text-xs text-gray-500">
              {room.showTime && <span>{showTime(room.showTime)}</span>}
            </div>
          </div>
        </a>
        {/* 隐藏/取消隐藏按钮 */}
        <button
          onClick={onClickButton}
          className={`absolute right-3 bottom-3 rounded-full px-2 py-0.5 text-xs ${
            isHidden
              ? "bg-blue-50 hover:bg-blue-100 text-blue-600"
              : "bg-gray-100 hover:bg-gray-200 text-gray-500"
          }`}>
          {isHidden ? "取消隐藏" : "隐藏"}
        </button>
      </div>
    </div>
  )
}
