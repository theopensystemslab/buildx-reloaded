import { useGesture } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { useEffect, useRef } from "react"
import { Group } from "three"
import { A, O } from "../../../utils/functions"
import { getFirstHouseLayout, layoutToColumns } from "./helpers"

const FreshApp = () => {
  const rootRef = useRef<Group>(null)

  // forget this for now, just useKey
  const bindAll = useGesture({
    onClick: console.log,
  }) as any

  const cleanup = () => {
    rootRef.current?.clear()
  }

  const init = () => {
    if (!rootRef.current) return

    // Object.values(vanillaColumns).forEach((vanillaColumn) => {
    //   rootRef.current!.add(vanillaColumnToGroup(vanillaColumn))
    // })

    pipe(
      getFirstHouseLayout(),
      O.map((layout) =>
        pipe(
          layout,
          layoutToColumns,
          A.map((columnGroup) => {
            rootRef.current!.add(columnGroup)
          })
        )
      )
    )

    return cleanup
  }

  useEffect(init, [])
  // useKey("l", insert1VanillaColumn)

  return <group ref={rootRef} {...bindAll()}></group>
}

export default FreshApp
