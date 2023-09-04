import { flow, pipe } from "fp-ts/lib/function"
import { RefObject } from "react"
import { Group, Material, Mesh } from "three"
import { A, O } from "../../../../utils/functions"
import {
  GridGroupUserData,
  HouseTransformsGroupUserData,
  isHouseTransformsGroup,
  UserDataTypeEnum,
} from "../scene/userData"
import {
  getActiveHouseUserData,
  getLayoutGroupColumnGroups,
} from "./sceneQueries"

const useClippingPlaneHelpers = (rootRef: RefObject<Group>) => {
  const initClippingPlanes = (houseId: string) => {
    if (!rootRef.current) return

    pipe(
      rootRef.current.children,
      A.filter(isHouseTransformsGroup),
      A.findFirst((x) => x.userData.houseId === houseId),
      O.map((houseTransformsGroup) => {
        const { clippingPlanes } =
          houseTransformsGroup.userData as HouseTransformsGroupUserData

        houseTransformsGroup.traverse((x) => {
          if (x.userData.type === UserDataTypeEnum.Enum.ElementMesh) {
            ;((x as Mesh).material as Material).clippingPlanes = clippingPlanes
          }
        })
      })
    )
  }

  const setYCut = (houseId: string, y: number) => {
    if (!rootRef.current) return

    pipe(
      rootRef.current.children,
      A.filter(isHouseTransformsGroup),
      A.findFirst((x) => x.userData.houseId === houseId),
      O.map((houseTransformsGroup) => {
        const {
          clippingPlanes: [, cpy],
          height,
        } = getActiveHouseUserData(houseTransformsGroup)
        cpy.constant = y
      })
    )
  }

  const houseLevelIndexToCutHeight = (
    houseId: string,
    levelIndex: number
  ): O.Option<number> => {
    if (!rootRef.current) return O.none

    return pipe(
      rootRef.current.children,
      A.filter(isHouseTransformsGroup),
      A.findFirst((x) => x.userData.houseId === houseId),
      O.map((x) => x.userData.getActiveLayoutGroup()),
      O.chain(
        flow(
          getLayoutGroupColumnGroups,
          A.head,
          O.chain((columnGroup) => {
            const gridGroups = columnGroup.children
            return pipe(
              gridGroups,
              A.findFirst((gridGroup) => {
                const gridGroupUserData =
                  gridGroup.userData as GridGroupUserData

                return gridGroupUserData.levelIndex === levelIndex
              }),
              O.map((gridGroup) => {
                const { height } = gridGroup.userData as GridGroupUserData
                return gridGroup.position.y + height / 2
              })
            )
          })
        )
      )
    )
  }

  return { setYCut, initClippingPlanes, houseLevelIndexToCutHeight }
}

export default useClippingPlaneHelpers
