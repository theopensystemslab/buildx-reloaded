import { invalidate } from "@react-three/fiber"
import { MutableRefObject, useEffect, useRef } from "react"
import { Group, Object3D } from "three"
import { proxy, ref } from "valtio"
import { useSubscribe } from "../utils/hooks"
import { isMesh } from "../utils/three"
import { HouseElementIdentifier } from "./gestures/drag"
import { useHouse } from "./houses"
import scope from "./scope"
import siteCtx, { SiteCtxModeEnum } from "./siteCtx"

type Highights = {
  outlined: Array<Object3D>
}
const highlights = proxy<Highights>({
  outlined: [],
})

const getModuleObjectsKey = ({
  columnIndex,
  levelIndex,
  gridGroupIndex,
}: {
  columnIndex: number
  levelIndex: number
  gridGroupIndex: number
}) => `${columnIndex},${levelIndex},${gridGroupIndex}`

export const useHouseElementOutline = (
  houseId: string,
  groupRef: MutableRefObject<Group>
) => {
  const elementObjects = useRef<Record<string, Object3D[]>>({})
  const moduleObjects = useRef<Record<string, Object3D[]>>({})
  const allObjects = useRef<Object3D[]>([])
  const { dna } = useHouse(houseId)

  useEffect(() => {
    elementObjects.current = {}
    allObjects.current = []

    groupRef.current.traverse((o3) => {
      if (
        !isMesh(o3) ||
        o3.userData.identifier?.identifierType !== "HOUSE_ELEMENT"
      )
        return

      const { elementName, columnIndex, levelIndex, gridGroupIndex } = o3
        .userData.identifier as HouseElementIdentifier

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

      const moduleObjectsKey = getModuleObjectsKey({
        columnIndex,
        levelIndex,
        gridGroupIndex,
      })

      if (!(moduleObjectsKey in moduleObjects.current)) {
        moduleObjects.current[moduleObjectsKey] = [o3]
      } else {
        moduleObjects.current[moduleObjectsKey].push(o3)
      }
    })

    allObjects.current = Object.values(elementObjects.current).flat()

    return () => {
      elementObjects.current = {}
      moduleObjects.current = {}
      allObjects.current = []
    }
  }, [groupRef, dna])

  useSubscribe(
    scope,
    () => {
      const { mode } = siteCtx

      if (scope.hovered === null && scope.selected === null) {
        highlights.outlined = []
        return
      }

      let o3s: Object3D[] = []

      switch (mode) {
        case SiteCtxModeEnum.Enum.SITE: {
          if (scope.hovered !== null) {
            if (
              scope.hovered.houseId === houseId &&
              allObjects.current.length > 0
            ) {
              o3s.push(...allObjects.current)
            }
          }
          if (scope.selected !== null) {
            if (
              scope.selected.houseId === houseId &&
              allObjects.current.length > 0
            ) {
              o3s.push(...allObjects.current)
            }
          }
          break
        }

        case SiteCtxModeEnum.Enum.BUILDING: {
          if (scope.hovered !== null) {
            if (
              scope.hovered.houseId === houseId &&
              scope.hovered.elementName in elementObjects.current &&
              elementObjects.current[scope.hovered.elementName].length > 0
            ) {
              o3s.push(...elementObjects.current[scope.hovered.elementName])
            }
          }
          if (scope.selected !== null) {
            if (
              scope.selected.houseId === houseId &&
              scope.selected.elementName in elementObjects.current &&
              elementObjects.current[scope.selected.elementName].length > 0
            ) {
              o3s.push(...elementObjects.current[scope.selected.elementName])
            }
          }
          break
        }

        case SiteCtxModeEnum.Enum.LEVEL: {
          if (scope.hovered !== null) {
            const moduleO3s =
              moduleObjects.current[getModuleObjectsKey(scope.hovered)] ?? []
            if (scope.hovered.houseId === houseId && moduleO3s.length > 0) {
              o3s.push(...moduleO3s)
            }
          }
          if (scope.selected !== null) {
            const moduleO3s =
              moduleObjects.current[getModuleObjectsKey(scope.selected)] ?? []
            if (scope.selected.houseId === houseId && moduleO3s.length > 0) {
              o3s.push(...moduleO3s)
            }
          }
          break
        }
      }

      highlights.outlined = ref(o3s)
    },
    true
  )
}

export default highlights
