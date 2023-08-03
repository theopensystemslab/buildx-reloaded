import { pipe } from "fp-ts/lib/function"
import { RefObject } from "react"
import { Group, Object3D } from "three"
import { A, O, pipeLog, someOrError } from "../../../../utils/functions"
import {
  HouseLayoutGroupUserData,
  HouseTransformsGroupUserData,
  UserDataTypeEnum,
} from "../userData"

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
    if (x.userData.type === UserDataTypeEnum.Enum.HouseTransformsGroup) {
      return x as Group
    }
    x = x.parent
  }
  throw new Error(
    `No ${UserDataTypeEnum.Enum.HouseTransformsGroup} parent found for ${object}`
  )
}

export const handleColumnGroupParentQuery = (object: Object3D) => {
  let x = object
  while (x.parent) {
    if (x.userData.type === UserDataTypeEnum.Enum.ColumnGroup) {
      return x as Group
    }
    x = x.parent
  }
  throw new Error(
    `No ${UserDataTypeEnum.Enum.ColumnGroup} parent found for ${object}`
  )
}

export const getHouseGroupColumns = (houseGroup: Group) =>
  pipe(
    houseGroup.children,
    A.head,
    O.map((columnsContainer) => columnsContainer.children as Group[]),
    someOrError("no columns container in house group")
  )

export const getActiveHouseUserData = (houseTransformsGroup: Group) =>
  pipe(
    houseTransformsGroup.children,
    A.findFirstMap((x) =>
      x.uuid ===
      (houseTransformsGroup.userData as HouseTransformsGroupUserData)
        .activeChildUuid
        ? O.some({
            ...(houseTransformsGroup.userData as HouseTransformsGroupUserData),
            ...(x.userData as HouseLayoutGroupUserData),
          })
        : O.none
    ),
    someOrError(`getActiveHouseUserData failure`)
  )

export const getLayoutGroups = (houseTransformsGroup: Group): Group[] =>
  houseTransformsGroup.children.filter(
    (x) => x.userData.type === UserDataTypeEnum.Enum.HouseLayoutGroup
  ) as Group[]

export const getActiveLayoutGroup = (houseTransformsGroup: Group): Group =>
  pipe(
    houseTransformsGroup.children,
    A.findFirst(
      (x) =>
        x.uuid ===
        (houseTransformsGroup.userData as HouseTransformsGroupUserData)
          .activeChildUuid
    ),
    someOrError(`getActiveLayoutGroup failure`)
  ) as Group

export const getPartitionedLayoutGroups = (houseTransformsGroup: Group) =>
  pipe(
    houseTransformsGroup,
    getLayoutGroups,
    pipeLog,
    A.partition((x) => x.uuid === houseTransformsGroup.userData.activeChildUuid)
  )

export const getLayoutGroupColumnGroups = (layoutGroup: Group): Group[] =>
  layoutGroup.children.filter(
    (x) => x.userData.type === UserDataTypeEnum.Enum.ColumnGroup
  ) as Group[]

export const getLayoutGroupBySectionType = (
  houseTransformsGroup: Group,
  sectionType: string
) => {
  const houseTransformsUserData =
    houseTransformsGroup.userData as HouseTransformsGroupUserData
  if (
    houseTransformsUserData.type !== UserDataTypeEnum.Enum.HouseTransformsGroup
  )
    throw new Error(
      `getLayoutGroupBySectionType called on type other than ${UserDataTypeEnum.Enum.HouseTransformsGroup}`
    )
  return pipe(
    houseTransformsGroup.children,
    A.findFirst(
      (group) =>
        (group.userData as HouseLayoutGroupUserData).sectionType === sectionType
    )
  )
}

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
