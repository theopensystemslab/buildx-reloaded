import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { A, O, R, T } from "~/utils/functions"
import { useSubscribeKey } from "~/utils/hooks"
import {
  setInvisibleNoRaycast,
  setVisible,
  setVisibleAndRaycast,
} from "~/utils/three"
import scope from "~/design/state/scope"
import siteCtx, {
  getModeBools,
  SiteCtxModeEnum,
  useModeChangeListener,
} from "~/design/state/siteCtx"
import useClippingPlaneHelpers from "../helpers/clippingPlanes"
import {
  findAllGuardDown,
  findFirstGuardAcross,
  findFirstGuardDown,
  getActiveHouseUserData,
  getActiveLayoutGroup,
} from "../helpers/sceneQueries"
import {
  HouseLayoutGroup,
  HouseTransformsGroup,
  isHouseLayoutGroup,
  isHouseTransformsGroup,
  isStretchHandleGroup,
  UserDataTypeEnum,
} from "../scene/userData"
import { RefObject, useEffect } from "react"
import { Group } from "three"
import layoutsDB from "../../../../db/layouts"
import { BIG_CLIP_NUMBER } from "../scene/houseTransformsGroup"
import { createHouseLayoutGroup } from "../scene/houseLayoutGroup"
import { liveQuery } from "dexie"

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

  useEffect(() => {
    const { unsubscribe } = liveQuery(() =>
      layoutsDB.altSectionTypeLayouts.toArray()
    ).subscribe((dbAltSectionTypeLayouts) => {
      console.log(`db alt section layouts type sub run`)
      if (!rootRef.current) return

      for (let { houseId, altSectionTypeLayouts } of dbAltSectionTypeLayouts) {
        pipe(
          rootRef.current,
          findFirstGuardAcross(
            (x): x is HouseTransformsGroup =>
              isHouseTransformsGroup(x) && x.userData.houseId === houseId
          ),
          O.map((houseTransformsGroup) => {
            console.log(`house transforms group`, houseTransformsGroup)
            // delete non-active layout groups
            // return active layout group
            const maybeActiveLayoutGroup = pipe(
              houseTransformsGroup.children,
              A.filter(isHouseLayoutGroup),
              A.partition(
                (x) =>
                  x.uuid === houseTransformsGroup.userData.activeLayoutGroupUuid
              ),
              ({ left: otherLayoutGroups, right: activeLayoutGroups }) => {
                console.log({
                  uuid: houseTransformsGroup.userData.activeLayoutGroupUuid,
                  activeLayoutGroups,
                  otherLayoutGroups,
                })
                otherLayoutGroups.forEach((x) => {
                  console.log(`removing for st ${x.userData.sectionType}`)
                  x.removeFromParent()
                })
                return pipe(activeLayoutGroups, A.head)
              }
            )

            console.log(maybeActiveLayoutGroup)

            console.log(siteCtx.houseId)

            if (houseId === siteCtx.houseId) {
              pipe(
                maybeActiveLayoutGroup,
                O.map((activeLayoutGroup) => {
                  pipe(
                    altSectionTypeLayouts,
                    R.filterMap(({ sectionType, layout, dnas }) => {
                      // maybe add the active section type to the house transforms group?
                      if (
                        sectionType.code ===
                        activeLayoutGroup.userData.sectionType
                      )
                        return O.none

                      createHouseLayoutGroup({
                        systemId: houseTransformsGroup.userData.systemId,
                        dnas,
                        houseId,
                        houseLayout: layout,
                      })().then((layoutGroup) => {
                        console.log(`posting for st ${sectionType.code}`)
                        setInvisibleNoRaycast(layoutGroup)
                        houseTransformsGroup.add(layoutGroup)
                      })

                      return O.none
                    })
                  )
                })
              )
            }
          })
        )
      }
    })

    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useSubscribeKey(scope, "selected", processHandles)
  useModeChangeListener(async ({ previous, next }) => {
    processHandles()
    processClippingPlanes()
    // if (
    //   previous === SiteCtxModeEnum.Enum.SITE &&
    //   next === SiteCtxModeEnum.Enum.BUILDING
    // ) {
    //   // house Id
    //   // get the stretch x stuff out of the db?
    //   // maybe clean out old stuff
    //   // ultimately pop some alternative invisible layouts in there!

    //   const { houseId } = siteCtx

    //   if (!houseId) return

    //   const dbResult = await layoutsDB.altSectionTypeLayouts.get(houseId)

    //   if (!dbResult) return

    //   if (!rootRef.current) return

    //   pipe(
    //     rootRef.current,
    //     findFirstGuardDown((x): x is HouseTransformsGroup => {
    //       if (!isHouseTransformsGroup(x)) return false
    //       if (x.userData.houseId !== houseId) return false
    //       return true
    //     }),
    //     O.map((houseTransformsGroup) => {
    //       const { systemId } = getActiveHouseUserData(houseTransformsGroup)

    //       pipe(
    //         dbResult.altSectionTypeLayouts,
    //         R.map(({ layout, dnas }) => {
    //           createHouseLayoutGroup({
    //             systemId,
    //             houseId,
    //             houseLayout: layout,
    //             dnas,
    //           })().then((layoutGroup) => {
    //             setVisible(layoutGroup, false)

    //             // remove same dnas ones
    //             pipe(
    //               houseTransformsGroup,
    //               findAllGuardDown(isHouseLayoutGroup),
    //               A.filter(
    //                 (x) => x.userData.dnas.toString() === dnas.toString()
    //               )
    //             ).forEach((layoutGroup) => {
    //               console.log(`removing ${layoutGroup.userData.sectionType}`)
    //               layoutGroup.removeFromParent()
    //             })
    //             houseTransformsGroup.add(layoutGroup)
    //             console.log(houseTransformsGroup.children)
    //           })
    //         })
    //       )
    //     })
    //   )
    // }
  })
}

export default useModeChange
