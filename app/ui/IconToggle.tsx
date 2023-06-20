import React, { useState, ReactNode } from "react"
import css from "./IconMenu.module.css"
import clsx from "clsx"

type Props = {
  icon: ReactNode
  active?: boolean
  onClick?: () => void
}

const IconToggle = ({ icon, active = false, onClick }: Props) => {
  // const [hovered, setHovered] = useState(false)

  return (
    <div
      className={css.container}
      // onMouseEnter={() => {
      //   setHovered(true)
      // }}
      // onMouseLeave={() => {
      //   setHovered(false)
      // }}
      onClick={onClick}
    >
      <button className={css.toggleButton} data-active={active}>
        {icon}
      </button>
    </div>
  )
}

export default IconToggle
