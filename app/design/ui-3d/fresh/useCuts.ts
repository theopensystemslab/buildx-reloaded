import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { RefObject } from "react"
import { Group } from "three"
import { A, O } from "../../../utils/functions"
import { useSubscribe } from "../../../utils/hooks"
import settings from "../../state/settings"
import { isHouseTransformsGroup } from "./scene/userData"

const useCuts = (rootRef: RefObject<Group>) => {
  useSubscribe(
    settings.verticalCuts,
    () => {
      const { width, length } = settings.verticalCuts

      pipe(
        rootRef.current,
        O.fromNullable,
        O.map((worldGroup) => {
          pipe(worldGroup.children, A.filter(isHouseTransformsGroup)).forEach(
            (htg) => {
              console.log(htg.userData.clippingPlanes)
              htg.userData.setVerticalCuts({ z: width, x: length })
            }
          )

          invalidate()
        })
      )
      // const { width, length } = settings.verticalCuts
      // const { levelIndex } = siteCtx

      // rootRef.current?.traverseVisible((o3) => {
      //   const userData = o3.userData as UserData

      //   switch (userData.type) {
      //     case UserDataTypeEnum.Enum.ElementMesh:
      //       break
      //     case UserDataTypeEnum.Enum.HouseTransformsGroup:
      //       // TypeScript knows that userData is of type HouseModuleGroupUserData in this block
      //       break
      //   }
      // })

      // Object.values(elementMaterials.current).forEach((material) => {
      //   material.clippingPlanes = [
      //     width ? [clippingPlaneZ] : [],
      //     levelIndex !== null ? [clippingPlaneY] : [],
      //     length ? [clippingPlaneX] : [],
      //   ].flat()
      // })
      invalidate()
    },
    true
  )
}

export default useCuts
