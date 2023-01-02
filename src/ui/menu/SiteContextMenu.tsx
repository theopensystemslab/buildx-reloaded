import { closeMenu } from "../../hooks/menu"
import { ScopeItem, useScope } from "../../hooks/scope"

const SiteContextMenu = ({ x: pageX, y: pageY }: { x: number; y: number }) => {
  // const { buildingId, levelIndex } = useSiteC()
  const scope = useScope()

  const props = {
    pageX,
    pageY,
    onClose: closeMenu,
    scope,
    // selected: scope.selected as ScopeItem,
  }

  return <pre>{JSON.stringify(props, null, 2)}</pre>

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

export default SiteContextMenu
