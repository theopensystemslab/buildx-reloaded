import { pipe } from "fp-ts/lib/function"
import { useRef } from "react"
import { Vector3 } from "three"
import { A, clamp, O, someOrError } from "../../../../utils/functions"
import pointer from "../../../state/pointer"
import { dispatchOutline } from "../events/outlines"
import {
  findFirstGuardAcross,
  getHouseTransformsGroupUp,
  sortLayoutGroupsByWidth,
} from "../helpers/sceneQueries"
import {
  AltLayoutGroupType,
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

    // const { activeLayoutGroup, otherLayoutGroups } =
    //   getPartitionedLayoutGroups(houseTransformsGroup)

    // ;[activeLayoutGroup, ...otherLayoutGroups].forEach((x) => {
    //   houseTransformsGroup.userData.setZStretchHandlesVisible(false)
    // })

    const otherSideHandleGroup = pipe(
      houseTransformsGroup,
      findFirstGuardAcross(
        (x): x is StretchHandleGroup =>
          isXStretchHandleGroup(x) && x.userData.side === otherSide
      ),
      someOrError(`other side handle group not found`)
    )

    let fenceIndex = 0

    const activeLayoutGroup =
      houseTransformsGroup.userData.getActiveLayoutGroup()

    const otherSTLayoutGroups = pipe(
      houseTransformsGroup.userData.layouts.alts,
      A.filterMap((x) =>
        x.type !== AltLayoutGroupType.Enum.ALT_SECTION_TYPE
          ? O.none
          : O.some(x.houseLayoutGroup)
      )
    )

    const fences = pipe(
      [activeLayoutGroup, ...otherSTLayoutGroups],
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

    let stepHandle = () => {
      handleGroup.position.setX(handleGroupX0 + side * clampedDistance)

      otherSideHandleGroup.position.setX(
        otherSideHandleGroupX0 - side * clampedDistance
      )
    }

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
            houseTransformsGroup.userData.setZStretchHandlesVisible(false)
            stretchXData.current!.fenceIndex++
            stepHandle()
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
            houseTransformsGroup.userData.setZStretchHandlesVisible(false)
            stretchXData.current!.fenceIndex--
            stepHandle()
          }
        })
      )
    }
  }

  const last = () => {
    const { fences, fenceIndex } = stretchXData.current!
    const activeLayoutGroup = fences[fenceIndex].layoutGroup
    const houseTransformsGroup =
      activeLayoutGroup.parent as HouseTransformsGroup
    houseTransformsGroup.userData.setActiveLayoutGroup(activeLayoutGroup)
    houseTransformsGroup.userData.updateHandles()
    houseTransformsGroup.userData.setZStretchHandlesVisible(true)
    houseTransformsGroup.userData.updateDB().then(() => {
      houseTransformsGroup.userData.refreshAltSectionTypeLayouts()
    })

    stretchXData.current = null
  }

  return { first, mid, last }
}

export default useOnDragStretchX
