import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { RefObject } from "react"
import { Group } from "three"
import { A, O } from "../../../../utils/functions"
import { useSubscribe } from "../../../../utils/hooks"
import settings from "../../../state/settings"
import { isHouseTransformsGroup } from "../scene/userData"

const useVerticalCuts = (rootRef: RefObject<Group>) => {
  useSubscribe(
    settings.verticalCuts,
    () => {
      pipe(
        rootRef.current,
        O.fromNullable,
        O.map((worldGroup) => {
          pipe(worldGroup.children, A.filter(isHouseTransformsGroup)).forEach(
            (htg) => {
              htg.userData.setVerticalCuts()
            }
          )

          invalidate()
        })
      )
    },
    true
  )
}

export default useVerticalCuts
