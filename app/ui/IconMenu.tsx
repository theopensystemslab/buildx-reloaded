import React, { useState, ReactNode } from "react"
import css from "./IconMenu.module.css"
import clsx from "clsx"

type Props = {
  icon: ReactNode
  children?: ReactNode
  active?: boolean
}

const IconMenu = ({ icon, children, active = false }: Props) => {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={css.container}
      onMouseEnter={() => {
        setHovered(true)
      }}
      onMouseLeave={() => {
        setHovered(false)
      }}
    >
      <button className={css.menuButton}>{icon}</button>
      {hovered && <div className={css.dropdown}>{children}</div>}
    </div>
  )
}

export default IconMenu
