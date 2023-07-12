import { A, O, R, RA, someOrError } from "~/utils/functions"
import { useSubscribe, useSubscribeKey } from "~/utils/hooks"
import { createMaterial, isMesh } from "~/utils/three"
import { invalidate } from "@react-three/fiber"
import { identity, pipe } from "fp-ts/lib/function"
import { MutableRefObject, RefObject, useEffect, useMemo, useRef } from "react"
import { Group, Material, Matrix4, Plane, Vector3 } from "three"
import { proxy, ref } from "valtio"
import { useElements, useSystemElements } from "~/data/elements"
import { useMaterials, useSystemMaterials } from "~/data/materials"
import elementCategories from "./elementCategories"
import houses, { useHouse } from "./houses"
import { layouts } from "./layouts"
import { useHousePreviews } from "./previews"
import settings from "./settings"
import siteCtx from "./siteCtx"
import { postTransformsTransients } from "./transients/transforms"
import { HouseLayoutsKey } from "../../db/layouts"

const getMaterialHash = ({
  systemId,
  houseId,
  materialName,
}: {
  systemId: string
  houseId: string
  materialName: string
}) => `${systemId}:${houseId}:${materialName}`

const hashedMaterials = proxy<Record<string, Material>>({})

export const useGetDefaultElementMaterial = (systemId: string) => {
  const elements = useElements()
  const materials = useMaterials()

  return (ifcTag: string) =>
    pipe(
      elements,
      A.findFirstMap((el) => {
        return el.ifc4Variable.toUpperCase() === ifcTag
          ? O.some(el.defaultMaterial)
          : O.none
      }),
      O.chain((materialName) =>
        pipe(
          materials,
          A.findFirstMap((x) =>
            x.specification === materialName
              ? O.some({ ...x, threeMaterial: createMaterial(x) })
              : O.none
          )
        )
      )
    )
}

export class ElementNotFoundError extends Error {
  constructor(public elementName: string, public systemId: string) {
    super(`No element found for ${elementName} in system ${systemId}`)
    this.name = "ElementNotFoundError"
  }
}

export class MaterialNotFoundError extends Error {
  constructor(public elementName: string, public systemId: string) {
    super(`No material found for ${elementName} in system ${systemId}`)
    this.name = "MaterialNotFoundError"
  }
}

export const useGetElementMaterial = () => {
  const elements = useElements()
  const materials = useMaterials()

  return (houseId: string, elementName: string) => {
    const house = houses[houseId]

    const materialName =
      elementName in house.modifiedMaterials
        ? house.modifiedMaterials[elementName]
        : pipe(
            elements,
            A.findFirstMap((el) =>
              el.name === elementName ? O.some(el.defaultMaterial) : O.none
            ),
            O.fold(() => {
              throw new ElementNotFoundError(elementName, house.systemId)
            }, identity)
          )

    return pipe(
      materials,
      A.findFirst((x) => x.specification === materialName),
      O.fold(() => {
        throw new MaterialNotFoundError(elementName, house.systemId)
      }, identity)
    )
  }
}

export const useGetElementMaterialName = () => {
  const elements = useElements()

  return (houseId: string, elementName: string) => {
    const house = houses[houseId]

    const materialName =
      elementName in house.modifiedMaterials
        ? house.modifiedMaterials[elementName]
        : pipe(
            elements,
            A.findFirstMap((el) =>
              el.name === elementName ? O.some(el.defaultMaterial) : O.none
            ),
            O.fold(() => {
              throw new ElementNotFoundError(elementName, house.systemId)
            }, identity)
          )

    return materialName
  }
}

export const useMaterialName = (houseId: string, elementName: string) => {
  const { modifiedMaterials, systemId } = useHouse(houseId)

  const { materials: materialsPreviews } = useHousePreviews(houseId)

  const elements = useSystemElements({ systemId })

  const defaultMaterialName = pipe(
    elements,
    RA.findFirstMap(({ name, defaultMaterial, category }) => {
      if (name !== elementName) return O.none
      if (!Object.keys(elementCategories).includes(category)) {
        elementCategories[category] = true
      }
      return O.some(defaultMaterial)
    }),
    O.fold(() => {
      throw new ElementNotFoundError(elementName, systemId)
    }, identity)
  )

  return useMemo(() => {
    if (elementName in materialsPreviews) {
      return materialsPreviews[elementName]
    } else if (elementName in modifiedMaterials)
      return modifiedMaterials[elementName]
    else {
      if (!defaultMaterialName) {
        console.error(
          `defaultMaterialName empty for ${elementName} in ${systemId}`
        )
      }
      return defaultMaterialName
    }
  }, [
    defaultMaterialName,
    elementName,
    materialsPreviews,
    modifiedMaterials,
    systemId,
  ])
}

export const useMaterial = ({
  systemId,
  houseId,
  elementName,
}: {
  systemId: string
  houseId: string
  elementName: string
}) => {
  const materialName = useMaterialName(houseId, elementName)

  const systemMaterials = useSystemMaterials({ systemId })

  const materialData = useMemo(
    () =>
      pipe(
        systemMaterials,
        RA.findFirst((m) => m.specification === materialName),
        O.fold(
          () => {
            throw new MaterialNotFoundError(elementName, systemId)
          },
          (foundMaterial) => foundMaterial
        )
      ),
    [elementName, materialName, systemId, systemMaterials]
  )

  return useMemo(() => {
    const materialHash = getMaterialHash({
      systemId,
      houseId,
      materialName,
    })
    const maybeMaterial = hashedMaterials?.[materialHash]
    if (maybeMaterial) return maybeMaterial

    const newMaterial = createMaterial(materialData)

    hashedMaterials[materialHash] = ref(newMaterial)

    return newMaterial
  }, [houseId, materialData, materialName, systemId])
}

const usePlaneMatrix = (houseId: string) => {
  const translationMatrix = useRef(new Matrix4())
  const rotationMatrix = useRef(new Matrix4())

  return () => {
    const {
      position: { dx, dy, dz } = { dx: 0, dy: 0, dz: 0 },
      rotation: dr = 0,
    } = postTransformsTransients[houseId] ?? {}

    const {
      position: { x, y, z },
      rotation,
    } = houses[houseId]

    rotationMatrix.current.makeRotationY(rotation + dr)

    translationMatrix.current.identity()
    translationMatrix.current.setPosition(x + dx, y + dy, z + dz)

    return translationMatrix.current.multiply(rotationMatrix.current)
  }
}

export const useHouseMaterialOps = ({
  ref,
  houseId,
  layoutsKey,
}: {
  houseId: string
  ref: RefObject<Group>
  layoutsKey: string
}) => {
  const systemId = houses[houseId].systemId
  const elementMaterials = useRef<Record<string, Material>>({})
  const categoryElements = useRef<Record<string, string[]>>({})
  const elements = useSystemElements({ systemId })

  const getPlaneMatrix = usePlaneMatrix(houseId)

  const clippingPlaneX = useMemo(() => new Plane(), [])
  const clippingPlaneY = useMemo(() => new Plane(), [])
  const clippingPlaneZ = useMemo(() => new Plane(), [])

  const xAxis = useMemo(() => new Vector3(1, 0, 0), [])
  const yAxis = useMemo(() => new Vector3(0, -1, 0), [])
  const zAxis = useMemo(() => new Vector3(0, 0, 1), [])

  const levelHeight =
    siteCtx.levelIndex === null
      ? Infinity
      : layouts[layoutsKey][0].gridGroups[siteCtx.levelIndex].y +
        layouts[layoutsKey][0].gridGroups[siteCtx.levelIndex].modules[0].module
          .height /
          2

  const updateMatrices = () => {
    const planeMatrix = getPlaneMatrix()

    clippingPlaneX.set(xAxis, 0)
    clippingPlaneX.applyMatrix4(planeMatrix)
    clippingPlaneY.set(yAxis, levelHeight)
    clippingPlaneY.applyMatrix4(planeMatrix)
    clippingPlaneZ.set(zAxis, 0)
    clippingPlaneZ.applyMatrix4(planeMatrix)

    invalidate()
  }
  useSubscribeKey(postTransformsTransients, houseId, updateMatrices, true)

  useEffect(() => {
    ref.current?.traverse((o3) => {
      if (
        !isMesh(o3) ||
        Array.isArray(o3.material) ||
        o3.userData.identifier?.identifierType !== "HOUSE_ELEMENT" ||
        o3.userData.identifier?.elementName in elementMaterials.current
      ) {
        return
      }

      const { elementName } = o3.userData.identifier

      elementMaterials.current[elementName] = o3.material

      pipe(
        elements,
        RA.findFirstMap(({ name, category }) =>
          name === elementName ? O.some(category) : O.none
        ),
        O.map((category) => {
          if (!(category in categoryElements.current)) {
            categoryElements.current[category] = [elementName]
          } else {
            categoryElements.current[category].push(elementName)
          }
        })
      )
    })

    return () => {
      elementMaterials.current = {}
      categoryElements.current = {}
    }
  }, [elements, ref])

  useSubscribe(
    elementCategories,
    (...ops) => {
      pipe(
        ops,
        A.map(
          A.chain(([_, categories, value]: any): any => {
            pipe(
              categoryElements.current,
              R.mapWithIndex((cat, elements) => {
                if (categories.includes(cat)) {
                  for (let element of elements) {
                    elementMaterials.current[element].visible = value
                  }
                }
              })
            )
          })
        )
      )
      invalidate()
    },
    true
  )

  useSubscribeKey(
    settings,
    "verticalCuts",
    () => {
      const { length, width } = settings.verticalCuts
      const { levelIndex } = siteCtx
      Object.values(elementMaterials.current).forEach((material) => {
        material.clippingPlanes = [
          width ? [clippingPlaneZ] : [],
          levelIndex !== null ? [clippingPlaneY] : [],
          length ? [clippingPlaneX] : [],
        ].flat()
      })
      invalidate()
    },
    true
  )
}

export default hashedMaterials
