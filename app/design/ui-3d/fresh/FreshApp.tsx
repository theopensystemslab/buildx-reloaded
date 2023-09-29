import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { Fragment, useRef } from "react"
import { Group } from "three"
import { A } from "../../../utils/functions"
import { useSubscribe } from "../../../utils/hooks"
import elementCategories from "../../state/elementCategories"
import XZPlane from "../XZPlane"
import { useHousesEvents } from "./events/houses"
import useModeChange from "./events/modeChange"
import useGestures from "./gestures"
import { isElementMesh } from "./scene/userData"

const FreshApp = () => {
  const rootRef = useRef<Group>(null)

  useHousesEvents(rootRef)
  useModeChange(rootRef)

  const bindAll = useGestures()

  useSubscribe(
    elementCategories,
    (...ops) => {
      if (!rootRef.current) return

      pipe(
        ops,
        A.map(
          A.chain(([_, categories, value]: any): any => {
            rootRef.current!.traverse((x) => {
              if (
                isElementMesh(x) &&
                categories.includes(x.userData.category)
              ) {
                x.visible = value
              }
            })
          })
        )
      )
      invalidate()
    },
    false
  )

  return (
    <Fragment>
      <group ref={rootRef} {...bindAll()}></group>
      <XZPlane />
    </Fragment>
  )
}

export default FreshApp
