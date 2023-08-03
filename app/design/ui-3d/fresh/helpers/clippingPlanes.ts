import { pipe } from "fp-ts/lib/function"
import { RefObject } from "react"
import { Group, Material, Mesh } from "three"
import { A, O } from "../../../../utils/functions"
import { HouseTransformsGroupUserData, UserDataTypeEnum } from "../userData"
import {
  getActiveHouseUserData,
  getActiveLayoutGroup,
  getHouseTransformGroup,
  mapHouseTransformGroup,
} from "./sceneQueries"

const useClippingPlaneHelpers = (rootRef: RefObject<Group>) => {
  const initClippingPlanes = (houseId: string) => {
    mapHouseTransformGroup(rootRef, houseId, (houseTransformGroup) => {
      const { clippingPlanes } =
        houseTransformGroup.userData as HouseTransformsGroupUserData

      console.log({ clippingPlanes })

      houseTransformGroup.traverse((x) => {
        if (x.userData.type === UserDataTypeEnum.Enum.ElementMesh) {
          ;((x as Mesh).material as Material).clippingPlanes = clippingPlanes
        }
      })

      console.log(houseTransformGroup)
    })
  }

  const setYCut = (houseId: string, y: number) => {
    mapHouseTransformGroup(rootRef, houseId, (houseTransformGroup) => {
      const {
        clippingPlanes,
        clippingPlanes: [cpx, cpy, cpz],
        height,
      } = getActiveHouseUserData(houseTransformGroup)
      cpy.constant = height / 2
    })
  }

  return { setYCut, initClippingPlanes }
}

export default useClippingPlaneHelpers
