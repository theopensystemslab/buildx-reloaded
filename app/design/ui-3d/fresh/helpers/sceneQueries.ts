import { pipe } from "fp-ts/lib/function"
import { RefObject } from "react"
import { Group, Object3D } from "three"
import { A, O, someOrError } from "../../../../utils/functions"
import { ColumnGroupUserData, UserDataTypeEnum } from "../userData"

export const rootHouseGroupChildQuery = (
  rootRef: RefObject<Group>,
  houseId: string
) =>
  pipe(
    rootRef.current?.children,
    O.fromNullable,
    O.chain(A.findFirst((x) => x.userData.houseId === houseId))
  )

export const rootHouseGroupParentQuery = (object: Object3D) => {
  let x = object
  while (x.parent) {
    if (x.userData.type === UserDataTypeEnum.Enum.HouseRootGroup) {
      return x as Group
    }
    x = x.parent
  }
  throw new Error(`No HouseRootGroup parent found for ${object}`)
}

export const handleColumnGroupParentQuery = (object: Object3D) => {
  let x = object
  while (x.parent) {
    if (x.userData.type === UserDataTypeEnum.Enum.ColumnGroup) {
      return x as Group
    }
    x = x.parent
  }
  throw new Error(`No HouseRootGroup parent found for ${object}`)
}

export const getHouseGroupColumns = (houseGroup: Group) =>
  pipe(
    houseGroup.children,
    A.head,
    O.map((columnsContainer) => columnsContainer.children as Group[]),
    someOrError("no columns container in house group")
  )

// should just be able to use house length

// export const getLastColumnEndZ = (houseGroup: Group) => {
//   return pipe(
//     getHouseGroupColumns(houseGroup),
//     A.last,
//     O.map((lastColumn) => {
//       const { length } = lastColumn.userData as ColumnGroupUserData
//       return length
//       // return pipe(lastColumn.children, A.last)
//     })
//   )
// }
