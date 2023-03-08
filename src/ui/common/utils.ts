import { useEffect } from "react"
import { type RefObject } from "react"

export const useClickAway = (
  ref: RefObject<HTMLElement | null>,
  callback?: () => void
) => {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!ref || !ref.current || ref.current.contains(event.target as any)) {
        return
      }
      callback && callback()
    }
    document.addEventListener("click", listener)
    return () => {
      document.removeEventListener("click", listener)
    }
  }, [ref, callback])
}

export const useEscape = (callback?: () => void) => {
  useEffect(() => {
    const handleKeyDown = (ev: any) => {
      if (ev.key === "Escape") {
        callback && callback()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [callback])
}
