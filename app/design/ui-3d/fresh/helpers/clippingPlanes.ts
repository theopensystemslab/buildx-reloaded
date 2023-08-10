import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { RefObject } from "react"
import { Group, Material, Mesh } from "three"
import { A, O } from "../../../../utils/functions"
import siteCtx, {
  SiteCtxModeEnum,
  useModeChangeListener,
} from "../../../state/siteCtx"
import {
  GridGroupUserData,
  HouseTransformsGroupUserData,
  UserDataTypeEnum,
} from "../userData"
import { BIG_CLIP_NUMBER } from "./layouts"
import {
  getActiveHouseUserData,
  getActiveLayoutGroup,
  getHouseTransformGroup,
  getLayoutGroupColumnGroups,
  mapHouseTransformGroup,
} from "./sceneQueries"

const useClippingPlaneHelpers = (rootRef: RefObject<Group>) => {
  const initClippingPlanes = (houseId: string) => {
    mapHouseTransformGroup(rootRef, houseId, (houseTransformGroup) => {
      const { clippingPlanes } =
        houseTransformGroup.userData as HouseTransformsGroupUserData

      houseTransformGroup.traverse((x) => {
        if (x.userData.type === UserDataTypeEnum.Enum.ElementMesh) {
          ;((x as Mesh).material as Material).clippingPlanes = clippingPlanes
        }
      })
    })
  }

  const setYCut = (houseId: string, y: number) => {
    mapHouseTransformGroup(rootRef, houseId, (houseTransformGroup) => {
      const {
        clippingPlanes: [, cpy],
        height,
      } = getActiveHouseUserData(houseTransformGroup)
      cpy.constant = y
    })
  }

  const houseLevelIndexToCutHeight = (houseId: string, levelIndex: number) => {
    return pipe(
      getHouseTransformGroup(rootRef, houseId),
      O.chain((houseTransformGroup) =>
        pipe(
          houseTransformGroup,
          getActiveLayoutGroup,
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
              })
            )
          })
        )
      ),
      O.map((gridGroup) => {
        const { height } = gridGroup.userData as GridGroupUserData
        return gridGroup.position.y + height / 2
      })
    )
  }

  return { setYCut, initClippingPlanes, houseLevelIndexToCutHeight }
}

export default useClippingPlaneHelpers
