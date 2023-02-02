import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { MutableRefObject, useEffect, useMemo, useRef } from "react"
import { Group, Material } from "three"
import { proxy, ref } from "valtio"
import { useSystemElements } from "../data/elements"
import { useSystemMaterials } from "../data/materials"
import { A, O, R, RA, someOrError } from "../utils/functions"
import { useSubscribe } from "../utils/hooks"
import { createMaterial, isMesh } from "../utils/three"
import elementCategories from "./elementCategories"
import { useHouse } from "./houses"

const getMaterialHash = ({
  systemId,
  houseId,
  elementName,
}: {
  systemId: string
  houseId: string
  elementName: string
}) => `${systemId}:${houseId}:${elementName}`

const hashedMaterials = proxy<Record<string, Material>>({})

export const useMaterialName = (houseId: string, elementName: string) => {
  const { modifiedMaterials, modifiedMaterialsPreview, systemId } =
    useHouse(houseId)
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
    someOrError("no element")
  )

  return useMemo(() => {
    if (elementName in modifiedMaterialsPreview)
      return modifiedMaterialsPreview[elementName]
    else if (elementName in modifiedMaterials)
      return modifiedMaterials[elementName]
    else return defaultMaterialName
  }, [
    defaultMaterialName,
    elementName,
    modifiedMaterials,
    modifiedMaterialsPreview,
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

  const materialData = pipe(
    systemMaterials,
    RA.findFirst((m) => m.name === materialName),
    someOrError("no material")
  )

  return useMemo(() => {
    const materialHash = getMaterialHash({
      systemId,
      houseId,
      elementName,
    })
    const maybeMaterial = hashedMaterials?.[materialHash]
    if (maybeMaterial) return maybeMaterial

    const newMaterial = createMaterial(materialData)

    hashedMaterials[materialHash] = ref(newMaterial)

    return newMaterial
  }, [elementName, houseId, materialData, systemId])
}

export const useHouseMaterialOps = (
  systemId: string,
  houseGroupRef: MutableRefObject<Group>
) => {
  const elementMaterials = useRef<Record<string, Material>>({})
  const categoryElements = useRef<Record<string, string[]>>({})
  const elements = useSystemElements({ systemId })

  useEffect(() => {
    houseGroupRef.current?.traverse((o3) => {
      if (
        !isMesh(o3) ||
        Array.isArray(o3.material) ||
        o3.userData.identifier?.identifierType !== "element" ||
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
  }, [elements, houseGroupRef])

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

  // const clipPlane = useMemo(() => new Plane(new Vector3(0, -1, 0), 0.5), [])
  // const toggle = useRef(false)

  // useKey("f", () => {
  //   console.log(elementMaterials.current)
  //   pipe(
  //     elementMaterials.current,
  //     R.map((material) => {
  //       material.clippingPlanes = toggle.current ? [clipPlane] : []
  //       console.log(material.clippingPlanes)
  //     })
  //   )
  //   toggle.current = !toggle.current
  //   invalidate()
  // })
}

export default hashedMaterials
