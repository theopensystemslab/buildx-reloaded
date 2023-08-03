import { liveQuery } from "dexie"
import { pipe } from "fp-ts/lib/function"
import { RefObject } from "react"
import { useKey } from "react-use"
import { Group, Object3D, Vector3 } from "three"
import layoutsDB from "../../../db/layouts"
import { A, O, R } from "../../../utils/functions"
import { PI } from "../../../utils/math"
import { yAxis } from "../../../utils/three"
import { updateEverything } from "./dimensions"
import { createLayoutGroup } from "./helpers/layouts"
import { getActiveHouseUserData } from "./helpers/sceneQueries"
import {
  insertVanillaColumn,
  subtractPenultimateColumn,
} from "./helpers/stretchZ"
import { UserDataTypeEnum } from "./userData"

const useKeyTestInteractions = (rootRef: RefObject<Group>) => {
  const getHouseGroups = () => {
    return (
      rootRef.current?.children.filter(
        (x: Object3D): x is Group =>
          x.userData.type === UserDataTypeEnum.Enum.HouseTransformsGroup
      ) ?? []
    )
  }

  useKey("z", async () => {
    for (let houseGroup of getHouseGroups()) {
      await insertVanillaColumn(houseGroup, 1)()
      updateEverything(houseGroup)
    }
  })

  useKey("Z", async () => {
    for (let houseGroup of getHouseGroups()) {
      await insertVanillaColumn(houseGroup, -1)()
      updateEverything(houseGroup)
    }
  })

  // stretch width -
  useKey("X", () => {})

  useKey("d", () => {
    for (let houseGroup of getHouseGroups()) {
      subtractPenultimateColumn(houseGroup, 1)
      updateEverything(houseGroup)
    }
  })

  useKey("D", () => {
    for (let houseGroup of getHouseGroups()) {
      subtractPenultimateColumn(houseGroup, -1)
      updateEverything(houseGroup)
    }
  })

  useKey("t", () => {
    for (let houseGroup of getHouseGroups()) {
      houseGroup.position.add(new Vector3(1, 0, 1))
      updateEverything(houseGroup)
    }
  })
  useKey("T", () => {
    for (let houseGroup of getHouseGroups()) {
      houseGroup.position.add(new Vector3(-1, 0, -1))
      updateEverything(houseGroup)
    }
  })

  useKey("r", () => {
    for (let houseGroup of getHouseGroups()) {
      houseGroup.rotateOnAxis(yAxis, PI / 8)
      updateEverything(houseGroup)
    }
  })

  useKey("R", () => {
    for (let houseGroup of getHouseGroups()) {
      houseGroup.rotateOnAxis(yAxis, -PI / 8)
      updateEverything(houseGroup)
    }
  })

  useKey("x", () => {
    for (let houseGroup of getHouseGroups()) {
    }
  })

  // toggle stretch width first pass
  // useKey("x", () => {
  //   // console.log(liveHouses)
  //   for (let houseId of Object.keys(liveHouses)) {
  //     const liveHouseGroup: Group = liveHouses[houseId]
  //     const stretchXGroups: Record<string, Group> = stretchXHouses[houseId]

  //     pipe(
  //       R.keys(stretchXGroups),
  //       A.head,
  //       O.map((k) =>
  //         pipe(
  //           stretchXGroups,
  //           R.lookup(k),
  //           O.map((firstGroup) => {
  //             setVisibleAndRaycast(firstGroup)
  //             setInvisible(liveHouseGroup)

  //             console.log("swapping groups")

  //             stretchXGroups[
  //               (liveHouseGroup.userData as HouseTransformsGroupUserData).sectionType
  //             ] = liveHouseGroup

  //             liveHouses[houseId] = firstGroup

  //             delete stretchXGroups[k]

  //             updateEverything(firstGroup)

  //             invalidate()
  //           })
  //         )
  //       )
  //     )
  //   }
  // })

  liveQuery(() => layoutsDB.altSectionTypeLayouts.toArray()).subscribe(
    (data) => {
      const houseGroups = getHouseGroups()
      for (const { houseId, altSectionTypeLayouts } of data) {
        pipe(
          houseGroups,
          A.findFirst((houseGroup) => houseGroup.userData.houseId === houseId),
          O.chain((houseTransformsGroup) =>
            pipe(
              houseTransformsGroup.children,
              A.head,
              O.map((houseLayoutGroup) =>
                pipe(
                  altSectionTypeLayouts,
                  R.map(({ layout: houseLayout }) => {
                    const { systemId, dnas } =
                      getActiveHouseUserData(houseTransformsGroup)

                    createLayoutGroup({
                      systemId,
                      dnas,
                      houseId,
                      houseLayout,
                    })

                    // probably needs to be the layout group
                    // houseLayoutToHouseGroup({
                    //   systemId,
                    //   houseId,
                    //   houseLayout,
                    // })
                  })
                )
              )
            )
          )
        )
      }
    }
  )
  //     for (const { houseId, altSectionTypeLayouts } of data) {
  //       pipe(
  //         liveHouses,
  //         R.lookup(houseId),
  //         O.map((liveHouseGroup) => {

  //           const layoutsTask = pipe(
  //             layoutTasks,
  //             R.traverse(T.ApplicativeSeq)(identity)
  //           )

  //           layoutsTask().then((groups) => {
  //             pipe(
  //               stretchXHouses[houseId],
  //               R.map((group) => rootRef.current?.remove(group))
  //             )
  //             pipe(
  //               groups,
  //               R.map((altHouseGroup) => {
  //                 setInvisible(altHouseGroup)

  //                 liveHouseGroup.matrix.decompose(
  //                   altHouseGroup.position,
  //                   altHouseGroup.quaternion,
  //                   altHouseGroup.scale
  //                 )

  //                 console.log(`adding altHouseGroup ${altHouseGroup.uuid}`)

  //                 rootRef.current?.add(altHouseGroup)
  //               })
  //             )

  //             console.log(
  //               `stretchXHouses[houseId] = ${Object.values(groups).map(
  //                 (x) => x.uuid
  //               )}`
  //             )
  //             stretchXHouses[houseId] = groups

  //             console.log(stretchXHouses)
  //           })
  //         })
  //       )
  //     }
}

export default useKeyTestInteractions
