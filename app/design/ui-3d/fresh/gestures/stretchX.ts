import { pipe } from "fp-ts/lib/function"
import { useRef } from "react"
import { Vector3 } from "three"
import { A, clamp, O, someOrError } from "../../../../utils/functions"
import pointer from "../../../state/pointer"
import { dispatchOutline } from "../events/outlines"
import {
  findFirstGuardAcross,
  getHouseTransformsGroupUp,
  sortAltLayoutsByWidth,
} from "../helpers/sceneQueries"
import {
  AltLayout,
  AltLayoutGroupType,
  HouseLayoutGroup,
  HouseTransformsGroup,
  isXStretchHandleGroup,
  StretchHandleGroup,
} from "../scene/userData"

type FenceX = {
  x: number
  layout: AltLayout | { type: "ACTIVE"; houseLayoutGroup: HouseLayoutGroup }
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

    const altLayouts = pipe(
      houseTransformsGroup.userData.layouts.alts,
      A.filter((x) => x.type === AltLayoutGroupType.Enum.ALT_SECTION_TYPE)
    )

    const fences = pipe(
      [
        { type: "ACTIVE" as const, houseLayoutGroup: activeLayoutGroup },
        ...altLayouts,
      ],
      sortAltLayoutsByWidth,
      A.mapWithIndex((i, layout): FenceX => {
        if (houseTransformsGroup.uuid === activeLayoutGroup.uuid) fenceIndex = i
        return {
          layout,
          x:
            (layout.houseLayoutGroup.userData.width -
              activeLayoutGroup.userData.width) /
            2,
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
            const { layout } = fences[fenceIndex + 1]
            if (layout.type === "ACTIVE") {
              houseTransformsGroup.userData.setPreviewLayout(null)
            } else {
              houseTransformsGroup.userData.setPreviewLayout(layout)
            }
            // houseTransformsGroup.userData.setActiveLayoutGroup(layoutGroup)
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
            const { layout } = fences[fenceIndex - 1]
            if (layout.type === "ACTIVE") {
              houseTransformsGroup.userData.setPreviewLayout(null)
            } else {
              houseTransformsGroup.userData.setPreviewLayout(layout)
            }

            houseTransformsGroup.userData.setZStretchHandlesVisible(false)
            stretchXData.current!.fenceIndex--
            stepHandle()
          }
        })
      )
    }
  }

  const last = () => {
    const { fences, fenceIndex, houseTransformsGroup } = stretchXData.current!
    const { layout } = fences[fenceIndex]
    if (layout.type === "ACTIVE") {
      if (houseTransformsGroup.userData.layouts.preview !== null)
        houseTransformsGroup.userData.setPreviewLayout(null)
    } else {
      houseTransformsGroup.userData.setActiveLayout(layout)
    }
    // houseTransformsGroup.userData.setActiveLayoutGroup(activeLayoutGroup)
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
