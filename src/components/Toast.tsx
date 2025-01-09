import { useEffect } from "react"

interface ToastProps {
  message: string
  onClose: () => void
  duration?: number
}

export function Toast({ message, onClose, duration = 2000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm shadow-lg animate-fade-in">
      {message}
    </div>
  )
}
