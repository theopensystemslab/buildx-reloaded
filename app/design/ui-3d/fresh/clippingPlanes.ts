import { Plane, Vector3 } from "three"

const clippingPlanes = {
  x: new Plane(),
  y: new Plane(),
  z: new Plane(),
}

const axes = {
  x: new Vector3(1, 0, 0),
  y: new Vector3(0, -1, 0),
  z: new Vector3(0, 0, 1),
}

//   const clippingPlaneX = useMemo(() => new Plane(), [])
//   const clippingPlaneY = useMemo(() => new Plane(), [])
//   const clippingPlaneZ = useMemo(() => new Plane(), [])

// export const dispatchClippingPlanesUpdate = () => {}

// export const onClippingPlanesUpdate = () => {}

export default clippingPlanes

// export const useClippingPlanes = ({
//   ref,
//   houseId,
//   layoutsKey,
// }: {
//   houseId: string
//   ref: RefObject<Group>
//   layoutsKey: string
// }) => {
//   const systemId = houses[houseId].systemId
//   const elementMaterials = useRef<Record<string, Material>>({})
//   const categoryElements = useRef<Record<string, string[]>>({})
//   const elements = useSystemElements({ systemId })

//   const getPlaneMatrix = usePlaneMatrix(houseId)

//   const xAxis = useMemo(() => new Vector3(1, 0, 0), [])
//   const yAxis = useMemo(() => new Vector3(0, -1, 0), [])
//   const zAxis = useMemo(() => new Vector3(0, 0, 1), [])

//   const levelHeight =
//     siteCtx.levelIndex === null
//       ? Infinity
//       : layouts[layoutsKey][0].gridGroups[siteCtx.levelIndex].y +
//         layouts[layoutsKey][0].gridGroups[siteCtx.levelIndex].modules[0].module
//           .height /
//           2

//   const updateMatrices = () => {
//     const planeMatrix = getPlaneMatrix()

//     clippingPlaneX.set(xAxis, 0)
//     clippingPlaneX.applyMatrix4(planeMatrix)
//     clippingPlaneY.set(yAxis, levelHeight)
//     clippingPlaneY.applyMatrix4(planeMatrix)
//     clippingPlaneZ.set(zAxis, 0)
//     clippingPlaneZ.applyMatrix4(planeMatrix)

//     invalidate()
//   }
//   useSubscribeKey(postTransformsTransients, houseId, updateMatrices, true)

//   useEffect(() => {
//     ref.current?.traverse((o3) => {
//       if (
//         !isMesh(o3) ||
//         Array.isArray(o3.material) ||
//         o3.userData.identifier?.identifierType !== "HOUSE_ELEMENT" ||
//         o3.userData.identifier?.elementName in elementMaterials.current
//       ) {
//         return
//       }

//       const { elementName } = o3.userData.identifier

//       elementMaterials.current[elementName] = o3.material

//       pipe(
//         elements,
//         RA.findFirstMap(({ name, category }) =>
//           name === elementName ? O.some(category) : O.none
//         ),
//         O.map((category) => {
//           if (!(category in categoryElements.current)) {
//             categoryElements.current[category] = [elementName]
//           } else {
//             categoryElements.current[category].push(elementName)
//           }
//         })
//       )
//     })

//     return () => {
//       elementMaterials.current = {}
//       categoryElements.current = {}
//     }
//   }, [elements, ref])

//   useSubscribe(
//     elementCategories,
//     (...ops) => {
//       pipe(
//         ops,
//         A.map(
//           A.chain(([_, categories, value]: any): any => {
//             pipe(
//               categoryElements.current,
//               R.mapWithIndex((cat, elements) => {
//                 if (categories.includes(cat)) {
//                   for (let element of elements) {
//                     elementMaterials.current[element].visible = value
//                   }
//                 }
//               })
//             )
//           })
//         )
//       )
//       invalidate()
//     },
//     true
//   )

//   useSubscribeKey(
//     settings,
//     "verticalCuts",
//     () => {
//       const { length, width } = settings.verticalCuts
//       const { levelIndex } = siteCtx
//       Object.values(elementMaterials.current).forEach((material) => {
//         material.clippingPlanes = [
//           width ? [clippingPlaneZ] : [],
//           levelIndex !== null ? [clippingPlaneY] : [],
//           length ? [clippingPlaneX] : [],
//         ].flat()
//       })
//       invalidate()
//     },
//     true
//   )
// }
