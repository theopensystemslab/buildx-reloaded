import { invalidate } from "@react-three/fiber"
import { MutableRefObject, useEffect, useRef } from "react"
import { Group, Object3D } from "three"
import { proxy, ref } from "valtio"
import { useSubscribe } from "../utils/hooks"
import { isMesh } from "../utils/three"
import { ElementIdentifier } from "./gestures/drag/elements"
import { useHouse } from "./houses"
import scope from "./scope"
import siteCtx, { SiteCtxModeEnum } from "./siteCtx"

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

export const useHouseElementOutline = (
  houseId: string,
  groupRef: MutableRefObject<Group>
) => {
  const elementObjects = useRef<Record<string, Object3D[]>>({})
  const allObjects = useRef<Object3D[]>([])
  const { dna } = useHouse(houseId)

  useEffect(() => {
    elementObjects.current = {}
    allObjects.current = []

    groupRef.current.traverse((o3) => {
      if (!isMesh(o3) || o3.userData.identifier?.identifierType !== "element")
        return

      const { elementName } = o3.userData.identifier as ElementIdentifier

      if (!(elementName in elementObjects.current)) {
        elementObjects.current[elementName] = [o3]
      } else {
        if (
          elementObjects.current[elementName].findIndex(
            (x) => x.id === o3.id
          ) === -1
        ) {
          elementObjects.current[elementName].push(o3)
        }
      }
    })

    allObjects.current = Object.values(elementObjects.current).flat()

    return () => {
      elementObjects.current = {}
      allObjects.current = []
    }
  }, [groupRef, dna])

  useSubscribe(
    scope,
    () => {
      const { mode } = siteCtx

      // const {} = scope.hovered

      // scope.hovered and scope.selected

      // just hovered first

      switch (mode) {
        case SiteCtxModeEnum.Enum.SITE:
          // outlineGroup(groupRef, {
          //   remove:
          //     scope.hovered?.houseId !== houseId &&
          //     scope.selected?.houseId !== houseId,
          // })
          // break
          break
        case SiteCtxModeEnum.Enum.BUILDING:
          if (!scope.hovered) return
          const { houseId: hoveredHouseId, elementName } = scope.hovered
          if (
            hoveredHouseId === houseId &&
            elementName in elementObjects.current &&
            elementObjects.current[elementName].length > 0
          ) {
            highlights.outlined = ref(elementObjects.current[elementName])
          }
          break
      }
    },
    true
  )
}

export const useHouseOutline = (
  houseId: string,
  groupRef: MutableRefObject<Group>
) => {
  const go = () => {
    if (!groupRef.current) return

    const { mode } = siteCtx

    switch (mode) {
      case SiteCtxModeEnum.Enum.SITE:
        outlineGroup(groupRef, {
          remove:
            scope.hovered?.houseId !== houseId &&
            scope.selected?.houseId !== houseId,
        })
        break
      case SiteCtxModeEnum.Enum.BUILDING:
        break
    }
  }

  useSubscribe(scope, go, true)
}

export default highlights
