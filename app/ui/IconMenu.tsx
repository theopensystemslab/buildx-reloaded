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

  const activityClass = clsx({
    [css.idle]: !active && !hovered,
    [css.hovered]: !active && hovered,
    [css.active]: active,
  })

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
      <button className={clsx(css.button, activityClass)}>{icon}</button>
      {hovered && (
        <div className={clsx(css.dropdown, activityClass)}>{children}</div>
      )}
    </div>
  )
}

export default IconMenu
