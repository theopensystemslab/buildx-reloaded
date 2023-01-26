import { invalidate } from "@react-three/fiber"
import { MutableRefObject, useEffect } from "react"
import { Group, Object3D } from "three"
import { proxy, ref } from "valtio"
import { useSubscribe } from "../utils/hooks"
import { isMesh } from "../utils/three"
import scope from "./scope"
import { SiteCtxModeEnum, useSiteCtx } from "./siteCtx"

type Highights = {
  outlined: Array<Object3D>
}
const highlights = proxy<Highights>({
  outlined: [],
})

export const outlineGroup = (
  groupRef: MutableRefObject<Group | null>,
  opts: { remove: boolean } = { remove: false }
) => {
  if (!groupRef.current) return

  const { remove = false } = opts
  const objs: Array<Object3D> = []

  let changed = false
  groupRef.current.traverse((o3) => {
    if (
      isMesh(o3) &&
      // TODO: tmp fix, FIXME
      o3.userData.identifier.identifierType !== "handle"
    ) {
      const next = ref(o3)
      objs.push(next)
      if (highlights.outlined.indexOf(next) === -1) changed = true
    }
  })

  if (changed && !remove) {
    highlights.outlined = objs
  }

  if (remove) {
    highlights.outlined = highlights.outlined.filter(
      (x) => objs.findIndex((y) => y.id === x.id) === -1
    )
  }

  invalidate()
}

export const useHouseOutline = (
  houseId: string,
  groupRef: MutableRefObject<Group>
) => {
  const { mode } = useSiteCtx()

  useSubscribe(
    scope,
    () => {
      if (mode !== SiteCtxModeEnum.Enum.SITE) return

      outlineGroup(groupRef, {
        remove:
          scope.hovered?.houseId !== houseId &&
          scope.selected?.houseId !== houseId,
      })
    },
    true
  )
}

export default highlights
