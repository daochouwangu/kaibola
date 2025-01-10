import type { Platform } from "~types/platform"
import { PLATFORM_CONFIGS } from "~utils/platforms"

interface PlatformTabsProps {
  platforms: Platform[]
  selectedPlatform: Platform | null
  onSelect: (platform: Platform | null) => void
}

export function PlatformTabs({
  platforms,
  selectedPlatform,
  onSelect
}: PlatformTabsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {PLATFORM_CONFIGS.filter((config) => platforms.includes(config.id)).map(
        (platform) => (
          <button
            key={platform.id}
            onClick={() =>
              onSelect(selectedPlatform === platform.id ? null : platform.id)
            }
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
              ${
                selectedPlatform === platform.id
                  ? "bg-blue-500 text-white shadow-sm"
                  : "bg-white text-gray-700 shadow-sm hover:bg-gray-50 border border-gray-200"
              }`}>
            {platform.name}
          </button>
        )
      )}
    </div>
  )
}
