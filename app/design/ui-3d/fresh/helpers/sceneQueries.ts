import { flow, pipe } from "fp-ts/lib/function"
import { RefObject } from "react"
import { Group, Intersection, Material, Mesh, Object3D, Plane } from "three"
import { A, Num, O, Ord, someOrError } from "../../../../utils/functions"
import { isMesh } from "../../../../utils/three"
import {
  ColumnGroup,
  ElementMesh,
  HouseLayoutGroup,
  HouseLayoutGroupUserData,
  HouseTransformsGroup,
  HouseTransformsGroupUserData,
  isColumnGroup,
  isElementMesh,
  isHouseLayoutGroup,
  isHouseTransformsGroup,
  UserDataTypeEnum,
} from "../scene/userData"

export const sortColumnsByIndex = A.sort(
  pipe(
    Num.Ord,
    Ord.contramap((x: ColumnGroup) => x.userData.columnIndex)
  )
)

export const sortLayoutGroupsByWidth = A.sort(
  pipe(
    Num.Ord,
    Ord.contramap((x: HouseLayoutGroup) => x.userData.width)
  )
)

export const findFirstGuardUp =
  <T extends Object3D>(guard: (o: Object3D) => o is T) =>
  (object: Object3D): O.Option<T> => {
    if (guard(object)) {
      return O.some(object)
    }

    const parent = object.parent

    if (parent !== null) {
      return findFirstGuardUp(guard)(parent)
    }

    return O.none
  }

export const findFirstGuardAcross =
  <T extends Object3D>(guard: (o: Object3D) => o is T) =>
  (object: Object3D): O.Option<T> => {
    const queue: Object3D[] = [object]

    while (queue.length > 0) {
      const current = queue.shift()
      if (!current) continue

      if (guard(current)) {
        return O.some(current)
      }

      queue.push(...current.children)
    }

    return O.none
  }

export const findFirstGuardDown =
  <T extends Object3D>(guard: (o: Object3D) => o is T) =>
  (object: Object3D): O.Option<T> => {
    if (guard(object)) {
      return O.some(object)
    }

    const children = object.children

    for (let i = 0, l = children.length; i < l; i++) {
      const child = children[i]
      const result = findFirstGuardDown(guard)(child)
      if (O.isSome(result)) {
        return result
      }
    }

    return O.none
  }

// findGuardAllDown will keep searching until no more matches are found.
export const findAllGuardDown =
  <T extends Object3D>(guard: (o: Object3D) => o is T) =>
  (object: Object3D): T[] => {
    let results: T[] = []

    if (guard(object)) {
      results.push(object)
    }

    const children = object.children

    for (let i = 0, l = children.length; i < l; i++) {
      results = results.concat(findAllGuardDown(guard)(children[i]))
    }

    return results
  }

// findGuardNDown will keep searching until N matches are found.
export const takeWhileGuardDown =
  <T extends Object3D>(guard: (o: Object3D) => o is T, n: number) =>
  (object: Object3D): T[] => {
    let results: T[] = []

    if (results.length >= n) {
      return results
    }

    if (guard(object)) {
      results.push(object)
    }

    const children = object.children

    for (let i = 0, l = children.length; i < l && results.length < n; i++) {
      results = results.concat(
        takeWhileGuardDown(guard, n - results.length)(children[i])
      )
    }

    return results
  }

export const getHouseTransformsGroupUp = (
  object: Object3D
): HouseTransformsGroup => {
  let x = object
  while (x.parent) {
    if (isHouseTransformsGroup(x)) return x
    x = x.parent
  }
  throw new Error(
    `No ${UserDataTypeEnum.Enum.HouseTransformsGroup} parent found for ${object}`
  )
}

export const getHouseGroupColumns = (houseGroup: Group) =>
  pipe(
    houseGroup.children,
    A.head,
    O.map((columnsContainer) => columnsContainer.children as Group[]),
    someOrError("no columns container in house group")
  )

export const getActiveHouseUserData = (
  houseTransformsGroup: HouseTransformsGroup
) => {
  const activeLayoutGroup = houseTransformsGroup.userData.getActiveLayoutGroup()

  return {
    ...houseTransformsGroup.userData,
    ...activeLayoutGroup.userData,
  }
}

export const getLayoutGroups = (
  houseTransformsGroup: HouseTransformsGroup
): HouseLayoutGroup[] =>
  houseTransformsGroup.children.filter(isHouseLayoutGroup)

export const getLayoutGroupColumnGroups = (
  layoutGroup: HouseLayoutGroup
): ColumnGroup[] => pipe(layoutGroup.children, A.filter(isColumnGroup))

export const getVisibleColumnGroups = (
  layoutGroup: HouseLayoutGroup
): ColumnGroup[] =>
  pipe(
    layoutGroup.children,
    A.filter((x): x is ColumnGroup => {
      if (!isColumnGroup(x)) return false
      if (x.visible === false) return false
      return true
    }),
    sortColumnsByIndex
  )

export const getSortedVisibleColumnGroups = flow(
  getVisibleColumnGroups,
  sortColumnsByIndex
)

export const getLayoutGroupColumnIndices = flow(
  getSortedVisibleColumnGroups,
  A.map((x) => x.userData.columnIndex)
)

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

export const objectToHouse = (object: Object3D) =>
  findFirstGuardUp(isHouseTransformsGroup)(object)

export const objectToIfcTagObjects = (object: Object3D) => {
  const ifcTag: string = object.userData.ifcTag

  return pipe(
    object,
    findFirstGuardUp(isHouseTransformsGroup),
    O.map((htg) =>
      pipe(
        htg.userData.getActiveLayoutGroup(),
        findAllGuardDown(
          (x): x is ElementMesh =>
            isElementMesh(x) && x.userData.ifcTag === ifcTag
        )
      )
    ),
    O.getOrElse((): ElementMesh[] => [])
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
          if (
            isMesh(object) &&
            object.visible &&
            !Array.isArray(object.material) &&
            object.material.clippingPlanes !== null
          ) {
            return object.material.clippingPlanes.every((plane: Plane) => {
              return plane.distanceToPoint(point) > 0
            })
          }
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
