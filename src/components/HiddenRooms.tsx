import type { Room } from "~types/Room"

interface HiddenRoomsProps {
  rooms: Room[]
  onUnhide: (id: string) => void
  onClose: () => void
}

export const HiddenRooms: React.FC<HiddenRoomsProps> = ({
  rooms,
  onUnhide,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-full max-w-4xl max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">已隐藏的直播间</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700">
            关闭
          </button>
        </div>

        {rooms.length === 0 ? (
          <div className="text-center text-gray-500 py-8">暂无隐藏的直播间</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <div
                key={room.roomId}
                className="border rounded-lg p-3 flex items-center gap-3">
                <img
                  src={room.avatar}
                  alt={room.streamerName}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <div className="font-bold">{room.streamerName}</div>
                  <div className="text-sm text-gray-500">{room.roomName}</div>
                </div>
                <button
                  onClick={() => onUnhide(room.roomId)}
                  className="px-3 py-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 text-sm">
                  取消隐藏
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
