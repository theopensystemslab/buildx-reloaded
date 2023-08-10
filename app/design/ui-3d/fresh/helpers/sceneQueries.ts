import { pipe } from "fp-ts/lib/function"
import { RefObject } from "react"
import { Group, Intersection, Material, Mesh, Object3D, Plane } from "three"
import { A, O, someOrError } from "../../../../utils/functions"
import {
  HouseLayoutGroupUserData,
  HouseTransformsGroupUserData,
  isHouseTransformsGroup,
  UserDataTypeEnum,
} from "../userData"

export const traverseUpUntil = (
  object: Object3D,
  condition: (o: Object3D) => boolean,
  callback: (o: Object3D) => void
) => {
  if (condition(object)) {
    callback(object)
    return
  }

  const parent = object.parent

  if (parent !== null) {
    traverseUpUntil(parent, condition, callback)
  }
}
export const traverseDownUntil = (
  object: Object3D,
  callback: (o: Object3D) => boolean // stops if returns true
): boolean => {
  if (callback(object)) {
    return true
  }

  const children = object.children

  for (let i = 0, l = children.length; i < l; i++) {
    if (traverseDownUntil(children[i], callback)) {
      return true
    }
  }

  return false
}

// export const traverseDownUntil = (
//   object: Object3D,
//   condition: (o: Object3D) => boolean,
//   callback: (o: Object3D) => void
// ) => {
//   if (condition(object)) {
//     callback(object)
//     return
//   }

//   const children = object.children

//   for (let i = 0, l = children.length; i < l; i++) {
//     traverseDownUntil(children[i], condition, callback)
//   }
// }

export const getHouseTransformGroup = (
  rootRef: RefObject<Object3D>,
  houseId: string
) =>
  pipe(
    rootRef.current?.children,
    O.fromNullable,
    O.chain(A.findFirst((x) => x.userData.houseId === houseId))
  ) as O.Option<Object3D>

export const mapHouseTransformGroup = (
  rootRef: RefObject<Object3D>,
  houseId: string,
  f: (houseTransformGroup: Object3D) => void
) => pipe(getHouseTransformGroup(rootRef, houseId), O.map(f))

export const mapAllHouseTransformGroups = (
  rootRef: RefObject<Object3D>,
  f: (houseTransformGroup: Object3D) => void
): void =>
  pipe(
    rootRef.current?.children ?? [],
    A.filter(isHouseTransformsGroup),
    A.map(f),
    () => void null
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

export const getActiveHouseUserData = (houseTransformsGroup: Object3D) =>
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

export const getActiveLayoutGroup = (
  houseTransformsGroup: Object3D
): Object3D =>
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
    A.partition((x) => x.uuid === houseTransformsGroup.userData.activeChildUuid)
  )

export const getLayoutGroupColumnGroups = (layoutGroup: Object3D): Object3D[] =>
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

export const objectToHouseObjects = (object: Object3D) =>
  object.parent!.parent!.parent!.parent!.children.flatMap((x) =>
    x.children.flatMap((y) => y.children.flatMap((z) => z.children))
  )

export const objectToIfcTagObjects = (object: Object3D) => {
  const ifcTag: string = object.userData.ifcTag

  return object.parent!.parent!.parent!.parent!.children.flatMap((x) =>
    x.children.flatMap((y) =>
      y.children.flatMap((z) =>
        z.children.filter((x) => x.userData.ifcTag === ifcTag)
      )
    )
  )
}

export const mapNearestCutIntersection = (
  intersections: Intersection[],
  f: (ix: Intersection) => void
) => {
  pipe(
    intersections,
    A.findFirst((ix) => {
      const { object, point } = ix
      switch (object.userData.type) {
        case UserDataTypeEnum.Enum.ElementMesh: {
          return (
            ((object as Mesh).material as Material).clippingPlanes as Plane[]
          ).every((plane) => {
            return plane.distanceToPoint(point) > 0
          })
        }
        case UserDataTypeEnum.Enum.RotateHandleMesh:
        case UserDataTypeEnum.Enum.StretchHandleMesh:
          return true
        default:
          return false
      }
    }),
    O.map(f)
  )
}
