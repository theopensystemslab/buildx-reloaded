import { pipe } from "fp-ts/lib/function"
import { Group, Object3D, Vector3 } from "three"
import { A, Num, Ord, T } from "../../../../utils/functions"
import {
  decrementColumnCount,
  HouseTransformsGroup,
  incrementColumnCount,
} from "../userData"
import { createColumnGroup, getVanillaColumn } from "./layouts"
import {
  sortColumnsByIndex,
  getActiveHouseUserData,
  getActiveLayoutGroup,
  getLayoutGroupColumnGroups,
} from "./sceneQueries"

export const insertVanillaColumn = (
  houseTransformsGroup: HouseTransformsGroup,
  direction: 1 | -1
) => {
  const { systemId, houseId, levelTypes, columnCount } =
    getActiveHouseUserData(houseTransformsGroup)

  return pipe(
    getVanillaColumn({ systemId, levelTypes }),
    T.chain(({ gridGroups }) =>
      pipe(
        createColumnGroup({ systemId, houseId, gridGroups, columnIndex: -1 })
      )
    ),
    T.map((vanillaColumnGroup) => {
      const layoutGroup = getActiveLayoutGroup(houseTransformsGroup)
      const vanillaColumnLength = vanillaColumnGroup.userData.length

      if (direction === 1) {
        pipe(
          // get column groups
          getLayoutGroupColumnGroups(layoutGroup),
          // last two
          A.filter((x) => x.userData.columnIndex >= columnCount - 2),
          A.sort(
            pipe(
              Num.Ord,
              Ord.contramap((x: Object3D) => x.userData.columnIndex)
            )
          ),
          ([penultimateColumnGroup, endColumnGroup]) => {
            // put vanilla column group in place
            vanillaColumnGroup.position.setZ(
              penultimateColumnGroup.position.z +
                penultimateColumnGroup.userData.length / 2 +
                vanillaColumnLength / 2
            )
            // add it
            layoutGroup.add(vanillaColumnGroup)

            // set its index
            vanillaColumnGroup.userData.columnIndex =
              penultimateColumnGroup.userData.columnIndex + 1

            // adjust end's index
            endColumnGroup.userData.columnIndex++

            incrementColumnCount(layoutGroup)
            // n.b. you're already adjusting the endColumnGroup's
            // position in the handler
          }
        )
      } else if (direction === -1) {
        pipe(
          getLayoutGroupColumnGroups(layoutGroup),
          sortColumnsByIndex,
          ([startColumnGroup, ...restColumnGroups]) => {
            for (let columnGroup of restColumnGroups) {
              columnGroup.position.add(new Vector3(0, 0, vanillaColumnLength))
              columnGroup.userData.columnIndex++
            }

            vanillaColumnGroup.userData.columnIndex = 1
            vanillaColumnGroup.position.setZ(
              startColumnGroup.position.z +
                startColumnGroup.userData.length +
                vanillaColumnLength / 2
            )
            layoutGroup.add(vanillaColumnGroup)

            incrementColumnCount(layoutGroup)
          }
        )
      }
    })
  )
}

export const subtractPenultimateColumn = (
  houseTransformsGroup: HouseTransformsGroup,
  direction: 1 | -1
) => {
  const layoutGroup = getActiveLayoutGroup(houseTransformsGroup)
  const columnGroups = getLayoutGroupColumnGroups(layoutGroup)
  const { columnCount } = getActiveHouseUserData(houseTransformsGroup)

  if (columnCount <= 3) return

  if (direction === 1) {
    pipe(
      columnGroups,
      A.filter((x) => x.userData.columnIndex >= columnCount - 2),
      A.sort(
        pipe(
          Num.Ord,
          Ord.contramap((x: Object3D) => x.userData.columnIndex)
        )
      ),
      ([penultimateColumnGroup, endColumnGroup]) => {
        endColumnGroup.position.sub(
          new Vector3(0, 0, penultimateColumnGroup.userData.length)
        )

        layoutGroup.remove(penultimateColumnGroup)

        decrementColumnCount(layoutGroup)
        endColumnGroup.userData.columnIndex--
      }
    )
  } else if (direction === -1) {
    pipe(
      columnGroups,
      A.sort(
        pipe(
          Num.Ord,
          Ord.contramap((x: Object3D) => x.userData.columnIndex)
        )
      ),
      ([_, secondColumnGroup, ...restColumnGroups]) => {
        const subV = new Vector3(0, 0, secondColumnGroup.userData.length)

        restColumnGroups.forEach((columnGroup) => {
          columnGroup.position.sub(subV)
          columnGroup.userData.columnIndex--
        })

        layoutGroup.remove(secondColumnGroup)

        decrementColumnCount(layoutGroup)
      }
    )
  }
}
