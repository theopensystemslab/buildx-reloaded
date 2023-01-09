import { closeMenu } from "../../hooks/menu"
import { useScope } from "../../hooks/scope"
import { useSiteCtxMode } from "../../hooks/siteCtx"
import { ContextMenuProps } from "./ContextMenu"
import ContextMenuSite from "./ContextMenuSite"

const ContextMenuEntry = ({ x: pageX, y: pageY }: { x: number; y: number }) => {
  // const { buildingId, levelIndex } = useSiteC()
  const { selected } = useScope()

  const mode = useSiteCtxMode()

  if (!selected) throw new Error("null selected")

  const props: ContextMenuProps = {
    pageX,
    pageY,
    onClose: closeMenu,
    selected,
  }

  switch (mode) {
    case "SITE":
      return <ContextMenuSite {...props} />
  }

  // return <pre>{JSON.stringify(props, null, 2)}</pre>

  // return selected === null ? null : (
  //   <div>
  //     {!buildingId ? (
  //       <SiteContextMenu_ {...props} />
  //     ) : levelIndex === null ? (
  //       <BuildingContextMenu {...props} />
  //     ) : (
  //       <LevelContextMenu {...props} />
  //     )}
  //   </div>
  // )

  return null
}

export default ContextMenuEntry
