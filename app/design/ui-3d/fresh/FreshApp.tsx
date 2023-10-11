import { invalidate, useThree } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { Fragment, useEffect, useRef } from "react"
import { Group, Scene } from "three"
import { A, O } from "../../../utils/functions"
import { useSubscribe, useSubscribeKey } from "../../../utils/hooks"
import elementCategories from "../../state/elementCategories"
import XZPlane from "../XZPlane"
import { useHousesEvents } from "./events/houses"
import useModeChange from "./events/modeChange"
import useGestures from "./gestures"
import { isElementMesh, isHouseTransformsGroup } from "./scene/userData"
import { proxy, ref, useSnapshot } from "valtio"
import siteCtx, {
  SiteCtxModeEnum,
  useModeChangeListener,
} from "../../state/siteCtx"
import { modeToHandleTypeEnum } from "./scene/houseTransformsGroup"
import scope from "../../state/scope"

const sceneProxy = proxy<{ scene: Scene | null }>({
  scene: null,
})

export const useScene = () => {
  const { scene } = useSnapshot(sceneProxy) as typeof sceneProxy
  return scene
}

const FreshApp = () => {
  const rootRef = useRef<Group>(null)

  useHousesEvents(rootRef)
  useModeChange(rootRef)

  // const processHandles = () => {

  //   pipe(
  //     rootRef.current,
  //     O.fromNullable,
  //     O.map((worldGroup) => {
  //       const { houseId, mode } = siteCtx

  //       pipe(
  //         worldGroup.children,
  //         A.filter(isHouseTransformsGroup),
  //         A.partition((x) => x.userData.houseId === houseId),
  //         ({ left: otherHouses, right: thisHouses }) => {
  //           pipe(
  //             thisHouses,
  //             A.head,
  //             O.map((thisHouse) => {
  //               // switch this house's handles by mode
  //               thisHouse.userData.switchHandlesVisibility(
  //                 modeToHandleTypeEnum(mode)
  //               )

  //               // if Site -> Building
  //               // refresh alt section type layouts
  //               // for x-stretch
  //               if (
  //                 prev === SiteCtxModeEnum.Enum.SITE &&
  //                 next === SiteCtxModeEnum.Enum.BUILDING
  //               ) {
  //                 thisHouse.userData.refreshAltSectionTypeLayouts()
  //               }
  //             })
  //           )

  //           // hide all other house handles
  //           otherHouses.forEach((otherHouse) => {
  //             otherHouse.userData.switchHandlesVisibility()
  //           })
  //         }
  //       )
  //     })
  //   )
  // }

  // useSubscribeKey(scope, "selected", processHandles)

  // useModeChangeListener(({ prev, next }) => {
  // })

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

  const scene = useThree((t) => t.scene)

  useEffect(() => {
    if (scene) sceneProxy.scene = ref(scene)
    else sceneProxy.scene = null
  }, [scene])

  return (
    <Fragment>
      <group ref={rootRef} name="WORLD" {...bindAll()}></group>
      <XZPlane />
    </Fragment>
  )
}

export default FreshApp
