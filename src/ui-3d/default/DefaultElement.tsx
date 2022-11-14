import { useHashedMaterial, useMaterialHash } from "@/hooks/hashedMaterials"
import { useRef } from "react"
import { Mesh } from "three"
import { ElementIdentifier } from "../../data/elements"
import { useHashedGeometry } from "../../hooks/hashedGeometries"
import { useMoveRotateSubscription } from "../../hooks/houses"
import { ModuleProps } from "./DefaultModule"

type Props = ModuleProps & {
  elementName: string
  geometryHash: string
}

const DefaultElement = (props: Props) => {
  const meshRef = useRef<Mesh>(null)
  const {
    systemId,
    houseId,
    elementName,
    geometryHash,
    columnIndex,
    levelIndex,
    gridGroupIndex,
  } = props

  const materialHash = useMaterialHash({
    systemId,
    houseId,
    elementName,
    visible: true,
    clippingPlanes: [],
  })

  const geometry = useHashedGeometry(geometryHash)
  const material = useHashedMaterial(materialHash)

  // useElementInstancePosition({
  //   ref: meshRef,
  //   systemId,
  //   houseId,
  //   columnIndex,
  //   levelIndex,
  //   gridGroupIndex,
  //   elementName,
  // })

  // const bind = useGesture<{ drag: ThreeEvent<PointerEvent> }>({
  //   onDrag: () => {
  //     if (events.drag === null) {
  //       events.drag = {
  //         houseId,
  //         initialXZ: globals.pointerXZ,
  //         positionDelta: [0, 0, 0],
  //       }
  //     } else {
  //       const {
  //         initialXZ,
  //         initialXZ: [ix, iz],
  //       } = events.drag
  //       const [x, z] = globals.pointerXZ
  //       events.drag = {
  //         houseId,
  //         initialXZ,
  //         positionDelta: [x - ix, 0, z - iz],
  //       }
  //     }
  //   },
  // })

  // useEffect(
  //   () =>
  //     subscribeKey(events.after, "newHouseTransform", () => {
  //       if (events.after.newHouseTransform === null) return
  //       const { houseId, positionDelta, rotation } =
  //         events.after.newHouseTransform
  //     }),
  //   []
  // )

  // const bind = useNewHouseEventsHandlers()

  useMoveRotateSubscription(houseId, meshRef)

  // const dontShow =
  //   columnIndex !== 0 || levelIndex !== 0 || !elementName.includes("Insulation")

  // useEffect(() => {
  //   if (dontShow || !meshRef.current) return

  //   console.log(elementName, meshRef.current.id)
  // }, [elementName, dontShow])

  // if (dontShow) return null

  return (
    <mesh
      ref={meshRef}
      material={material}
      geometry={geometry}
      userData={{
        elementIdentifier: {
          systemId,
          houseId,
          columnIndex,
          levelIndex,
          gridGroupIndex,
          elementName,
        } as ElementIdentifier,
      }}
      // {...(bind() as any)}
    />
  )
}

export default DefaultElement
