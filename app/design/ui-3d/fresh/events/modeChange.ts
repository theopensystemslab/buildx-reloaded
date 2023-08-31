import { invalidate } from "@react-three/fiber"
import { liveQuery } from "dexie"
import { pipe } from "fp-ts/lib/function"
import { RefObject, useEffect } from "react"
import { Group } from "three"
import scope from "~/design/state/scope"
import siteCtx, {
  getModeBools,
  useModeChangeListener,
} from "~/design/state/siteCtx"
import { A, O, R } from "~/utils/functions"
import { useSubscribeKey } from "~/utils/hooks"
import { setInvisibleNoRaycast, setVisibleAndRaycast } from "~/utils/three"
import layoutsDB from "../../../../db/layouts"
import useClippingPlaneHelpers from "../helpers/clippingPlanes"
import {
  findAllGuardDown,
  findFirstGuardAcross,
  getActiveHouseUserData,
} from "../helpers/sceneQueries"
import { createHouseLayoutGroup } from "../scene/houseLayoutGroup"
import { BIG_CLIP_NUMBER } from "../scene/houseTransformsGroup"
import {
  HouseTransformsGroup,
  isHouseLayoutGroup,
  isHouseTransformsGroup,
  isStretchHandleGroup,
  UserDataTypeEnum,
} from "../scene/userData"

const useModeChange = (rootRef: RefObject<Group>) => {
  const showHouseStretchHandles = (houseId: string) => {
    if (!rootRef.current) return

    const allHouseTransformGroups = pipe(
      rootRef.current.children,
      A.filter(isHouseTransformsGroup)
    )

    pipe(
      allHouseTransformGroups,
      A.findFirst((x) => x.userData.houseId === houseId),
      O.map((houseTransformsGroup) =>
        pipe(
          houseTransformsGroup,
          findAllGuardDown(isStretchHandleGroup)
        ).forEach((handleGroup) => {
          setVisibleAndRaycast(handleGroup)
        })
      )
    )
  }

  const hideAllHandles = () => {
    rootRef.current?.traverse((node) => {
      if (
        node.userData.type === UserDataTypeEnum.Enum.StretchHandleGroup ||
        node.userData.type === UserDataTypeEnum.Enum.RotateHandlesGroup
      ) {
        setInvisibleNoRaycast(node)
      }
    })
  }

  const { houseLevelIndexToCutHeight, setYCut } =
    useClippingPlaneHelpers(rootRef)

  const showHouseRotateHandles = (houseId: string) => {
    if (!rootRef.current) return

    const allHouseTransformGroups = pipe(
      rootRef.current.children,
      A.filter(isHouseTransformsGroup)
    )

    pipe(
      allHouseTransformGroups,
      A.findFirst((x) => x.userData.houseId === houseId),
      O.map((houseTransformsGroup) =>
        houseTransformsGroup.traverse((node) => {
          if (node.userData.type === UserDataTypeEnum.Enum.RotateHandlesGroup) {
            setVisibleAndRaycast(node)
          }
        })
      )
    )
  }

  const processHandles = () => {
    if (!rootRef.current) return

    const { houseId } = siteCtx
    const { selected } = scope
    const { buildingMode, levelMode, siteMode } = getModeBools()

    hideAllHandles()

    if (houseId && (buildingMode || levelMode)) {
      showHouseStretchHandles(houseId)
    }

    if (siteMode) {
      if (selected !== null) {
        const { houseId } = selected
        showHouseRotateHandles(houseId)
      }
    }

    invalidate()
  }

  const processClippingPlanes = () => {
    if (!rootRef.current) return

    const { houseId, levelIndex } = siteCtx
    const { levelMode } = getModeBools()

    const allHouseTransformGroups = pipe(
      rootRef.current.children,
      A.filter(isHouseTransformsGroup)
    )

    pipe(
      allHouseTransformGroups,
      A.findFirst((x) => x.userData.houseId === houseId),
      O.map((houseTransformsGroup) => {
        const { houseId } = getActiveHouseUserData(houseTransformsGroup)
        setYCut(houseId, BIG_CLIP_NUMBER)
      })
    )

    if (levelMode) {
      if (houseId !== null && levelIndex !== null) {
        pipe(
          houseLevelIndexToCutHeight(houseId, levelIndex),
          O.map((cutHeight) => {
            setYCut(houseId, cutHeight)
          })
        )
      }
    }
  }

  // set up a separate listener for when houses dnas changes in the db
  // useEffect(() => {
  //   const { unsubscribe } = liveQuery(() =>
  //     layoutsDB.altSectionTypeLayouts.toArray()
  //   ).subscribe((dbAltSectionTypeLayouts) => {
  //     if (!rootRef.current) return

  //     for (let { houseId, altSectionTypeLayouts } of dbAltSectionTypeLayouts) {
  //       pipe(
  //         rootRef.current,
  //         findFirstGuardAcross(
  //           (x): x is HouseTransformsGroup =>
  //             isHouseTransformsGroup(x) && x.userData.houseId === houseId
  //         ),
  //         O.map((houseTransformsGroup) => {
  //           // delete non-active layout groups
  //           // return active layout group
  //           const maybeActiveLayoutGroup = pipe(
  //             houseTransformsGroup.children,
  //             A.filter(isHouseLayoutGroup),
  //             A.partition(
  //               (x) =>
  //                 x.uuid === houseTransformsGroup.userData.activeLayoutGroupUuid
  //             ),
  //             ({ left: otherLayoutGroups, right: activeLayoutGroups }) => {
  //               // test comment
  //               // otherLayoutGroups.forEach((x) => {
  //               //   x.removeFromParent()
  //               // })
  //               return pipe(activeLayoutGroups, A.head)
  //             }
  //           )

  //           if (houseId === siteCtx.houseId) {
  //             pipe(
  //               maybeActiveLayoutGroup,
  //               O.map((activeLayoutGroup) => {
  //                 pipe(
  //                   altSectionTypeLayouts,
  //                   R.filterMap(({ sectionType, layout, dnas }) => {
  //                     // maybe add the active section type to the house transforms group?
  //                     if (
  //                       sectionType.code ===
  //                       activeLayoutGroup.userData.sectionType
  //                     )
  //                       return O.none

  //                     createHouseLayoutGroup({
  //                       systemId: houseTransformsGroup.userData.systemId,
  //                       dnas,
  //                       houseId,
  //                       houseLayout: layout,
  //                       creator: `altSectionTypeLayouts database subscriber`,
  //                     })().then((layoutGroup) => {
  //                       setInvisibleNoRaycast(layoutGroup)
  //                       houseTransformsGroup.add(layoutGroup)
  //                     })

  //                     return O.none
  //                   })
  //                 )
  //               })
  //             )
  //           }
  //         })
  //       )
  //     }
  //   })

  //   return unsubscribe
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [])

  useSubscribeKey(scope, "selected", processHandles)

  useModeChangeListener(() => {
    processHandles()
    processClippingPlanes()
  })
}

export default useModeChange
