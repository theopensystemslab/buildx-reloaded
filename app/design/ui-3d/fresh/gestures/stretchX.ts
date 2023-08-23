import { pipe } from "fp-ts/lib/function"
import { useRef } from "react"
import { Vector3 } from "three"
import { A, clamp, O, someOrError } from "../../../../utils/functions"
import pointer from "../../../state/pointer"
import { dispatchOutline } from "../events/outlines"
import {
  findFirstGuardAcross,
  getHouseTransformsGroupUp,
  getPartitionedLayoutGroups,
  sortLayoutGroupsByWidth,
} from "../helpers/sceneQueries"
import {
  HouseLayoutGroup,
  HouseTransformsGroup,
  isXStretchHandleGroup,
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
    lo: number
    hi: number
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

    ;[activeLayoutGroup, ...otherLayoutGroups].forEach((x) => {
      x.userData.setLengthHandlesVisible(false)
    })

    const otherSideHandleGroup = pipe(
      houseTransformsGroup,
      findFirstGuardAcross(
        (x): x is StretchHandleGroup =>
          isXStretchHandleGroup(x) && x.userData.side === otherSide
      ),
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

    const lo = side * fences[0].x
    const hi = side * fences[fences.length - 1].x

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
      lo,
      hi,
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
      lo,
      hi,
    } = stretchXData.current

    const { side } = handleGroup.userData

    const [x1, z1] = pointer.xz
    const distanceVector = new Vector3(x1, 0, z1).sub(point0)
    distanceVector.applyAxisAngle(
      new Vector3(0, 1, 0),
      -houseTransformsGroup.rotation.y
    )
    const distance = distanceVector.x

    const distanceWithSide = side * distance

    const clampedDistance = clamp(side * lo, side * hi)(distanceWithSide)

    // const lo = handleGroupX0 + side * fences[0].x
    // const hi = handleGroupX0 + side * fences[fences.length - 1].x

    // const c = clamp(lo, hi)

    console.log({ lo, hi, distance, distanceWithSide })

    handleGroup.position.setX(handleGroupX0 + side * clampedDistance)

    console.log({ side: handleGroup.userData.side })

    // const c2 = clamp(-hi, -lo)

    otherSideHandleGroup.position.setX(
      otherSideHandleGroupX0 - side * clampedDistance
    )

    const adjustedDistance = side * distance
    const adjustedLastDistance = side * lastDistance

    if (adjustedDistance > adjustedLastDistance) {
      pipe(
        fences,
        A.lookup(fenceIndex + 1),
        O.map(({ x }) => {
          if (adjustedDistance >= x) {
            const layoutGroup = fences[fenceIndex + 1].layoutGroup
            houseTransformsGroup.userData.setActiveLayoutGroup(layoutGroup)
            layoutGroup.userData.setLengthHandlesVisible(false)
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
            const layoutGroup = fences[fenceIndex - 1].layoutGroup
            houseTransformsGroup.userData.setActiveLayoutGroup(layoutGroup)
            layoutGroup.userData.setLengthHandlesVisible(false)
            stretchXData.current!.fenceIndex--
          }
        })
      )
      // tbc
    }
    // if next fence up
  }

  const last = () => {
    const { fences, fenceIndex } = stretchXData.current!
    const activeLayoutGroup = fences[fenceIndex].layoutGroup
    activeLayoutGroup.userData.setLengthHandlesVisible(true)

    stretchXData.current = null
  }

  return { first, mid, last }
}

export default useOnDragStretchX
