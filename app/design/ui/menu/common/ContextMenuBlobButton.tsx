import React, { PropsWithChildren, ReactNode } from "react"
import css from "./ContextMenuButton.module.css"

type BlobButtonProps = {
  href: string // Blob URL for the file to download
  download: string // Filename for the downloaded file
  icon: ReactNode
  text: string
  unpaddedSvg?: boolean
  onHover?: (hovered: boolean) => void
  onClick?: () => void
}

export const ContextMenuBlobButton = (
  props: PropsWithChildren<BlobButtonProps>
) => {
  const {
    href,
    download: downloadFilename,
    icon,
    text,
    unpaddedSvg,
    onHover,
    onClick,
  } = props

  return (
    <a
      href={href}
      download={downloadFilename}
      className={css.root}
      onMouseOver={() => onHover?.(true)}
      onMouseOut={() => onHover?.(false)}
      onClick={onClick}
    >
      <span className={css.icon} data-unpadded-svg={unpaddedSvg}>
        {icon}
      </span>
      <span>{text}</span>
    </a>
  )
}
