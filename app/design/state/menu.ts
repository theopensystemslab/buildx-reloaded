import { proxy, useSnapshot } from "valtio"
import scope, { clearHovered, clearSelected } from "./scope"

const menu = proxy({
  open: false,
  x: 0,
  y: 0,
})

export const openMenu = (x: number, y: number) => {
  menu.open = true
  menu.x = x
  menu.y = y
}

export const closeMenu = () => {
  menu.open = false
  // clearSelected()
  // clearHovered()
}

export const useMenu = () => useSnapshot(menu)

export default menu
