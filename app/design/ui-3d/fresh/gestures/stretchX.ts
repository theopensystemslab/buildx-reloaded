import { pipe } from "fp-ts/lib/function"
import { useRef } from "react"
import { Vector3 } from "three"
import { A, O, someOrError } from "../../../../utils/functions"
import pointer from "../../../state/pointer"
import { dispatchOutline } from "../events/outlines"
import {
  getHouseTransformsGroupUp,
  getPartitionedLayoutGroups,
  sortLayoutGroupsByWidth,
} from "../helpers/sceneQueries"
import {
  HouseLayoutGroup,
  HouseTransformsGroup,
  isStretchHandleGroup,
  StretchHandleGroup,
} from "../scene/userData"

type FenceX = {
  x: number
  layoutGroup: HouseLayoutGroup
}

const useOnDragStretchX = () => {
  const stretchXData = useRef<{
    point0: Vector3
    handleGroupX0: number
    houseTransformsGroup: HouseTransformsGroup
    handleGroup: StretchHandleGroup
    otherSideHandleGroup: StretchHandleGroup
    otherSideHandleGroupX0: number
    fences: FenceX[]
    fenceIndex: number
    lastDistance: number
  } | null>(null)

  const first = ({
    point,
    handleGroup,
  }: {
    handleGroup: StretchHandleGroup
    point: Vector3
  }) => {
    dispatchOutline({
      hoveredObjects: [],
      selectedObjects: [],
    })

    const { side } = handleGroup.userData
    const otherSide = side * -1

    const houseTransformsGroup = getHouseTransformsGroupUp(handleGroup)
    const { activeLayoutGroup, otherLayoutGroups } =
      getPartitionedLayoutGroups(houseTransformsGroup)

    const otherSideHandleGroup = pipe(
      houseTransformsGroup.children,
      A.findFirst((x): x is StretchHandleGroup => {
        return (
          isStretchHandleGroup(x) &&
          x.userData.axis === "x" &&
          x.userData.side === otherSide
        )
      }),
      someOrError(`other side handle group not found`)
    )

    let fenceIndex = 0

    const fences = pipe(
      [activeLayoutGroup, ...otherLayoutGroups],
      sortLayoutGroupsByWidth,
      A.mapWithIndex((i, layoutGroup): FenceX => {
        if (layoutGroup.uuid === activeLayoutGroup.uuid) fenceIndex = i
        return {
          layoutGroup,
          x:
            (layoutGroup.userData.width - activeLayoutGroup.userData.width) / 2,
        }
      })
    )

    console.log(fences)

    stretchXData.current = {
      handleGroup,
      otherSideHandleGroup,
      otherSideHandleGroupX0: otherSideHandleGroup.position.x,
      houseTransformsGroup,
      point0: point,
      fences,
      handleGroupX0: handleGroup.position.x,
      fenceIndex,
      lastDistance: 0,
    }
  }
  const mid = () => {
    if (!stretchXData.current) return

    const {
      point0,
      houseTransformsGroup,
      handleGroup,
      handleGroupX0,
      otherSideHandleGroup,
      otherSideHandleGroupX0,
      fences,
      fenceIndex,
      lastDistance,
    } = stretchXData.current

    const { side } = handleGroup.userData

    const [x1, z1] = pointer.xz
    const distanceVector = new Vector3(x1, 0, z1).sub(point0)
    distanceVector.applyAxisAngle(
      new Vector3(0, 1, 0),
      -houseTransformsGroup.rotation.y
    )
    const distance = distanceVector.x
    handleGroup.position.setX(handleGroupX0 + distance)
    otherSideHandleGroup.position.setX(otherSideHandleGroupX0 - distance)

    const adjustedDistance = side * distance
    const adjustedLastDistance = side * lastDistance

    if (adjustedDistance > adjustedLastDistance) {
      pipe(
        fences,
        A.lookup(fenceIndex + 1),
        O.map(({ x }) => {
          if (adjustedDistance >= x) {
            console.log(1)
            houseTransformsGroup.userData.setActiveLayoutGroup(
              fences[fenceIndex + 1].layoutGroup
            )
            stretchXData.current!.fenceIndex++
          }
        })
      )
    } else if (adjustedDistance < adjustedLastDistance) {
      pipe(
        fences,
        A.lookup(fenceIndex - 1),
        O.map(({ x }) => {
          if (adjustedDistance <= x) {
            houseTransformsGroup.userData.setActiveLayoutGroup(
              fences[fenceIndex - 1].layoutGroup
            )
            stretchXData.current!.fenceIndex--
          }
        })
      )
      // tbc
    }
    // if next fence up
  }

  const last = () => {}

  return { first, mid, last }
}

export default useOnDragStretchX
