import { Module } from "@/data/module"
import { GroupProps, useLoader } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import { Group, Plane } from "three"
import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from "three-mesh-bvh"
import { ref } from "valtio"
import { IFCLoader } from "web-ifc-three"
import ifcStore from "../hooks/ifc"

type Props = GroupProps & {
  module: Module
  columnIndex: number
  levelIndex: number
  groupIndex: number
  houseId: string
  levelY: number
  verticalCutPlanes: Plane[]
}

const IfcModule = (props: Props) => {
  const {
    houseId,
    columnIndex,
    levelIndex,
    groupIndex,
    module,
    levelY,
    verticalCutPlanes,
    ...groupProps
  } = props

  const groupRef = useRef<Group>(null)

  const key = `${houseId}:${columnIndex},${levelIndex},${groupIndex}`

  const ifcModel = useLoader(IFCLoader, module.ifcUrl, (loader) => {
    if (loader instanceof IFCLoader) {
      loader.ifcManager.setWasmPath("../../../wasm/")
    }
  })

  useEffect(() => {
    if (!groupRef.current) return
    ifcStore.models[key] = ref(ifcModel)
    groupRef.current.add(ifcModel)

    ifcModel?.ifcManager?.setupThreeMeshBVH(
      computeBoundsTree,
      disposeBoundsTree,
      acceleratedRaycast
    )
    return () => {
      delete ifcStore.models[key]
    }
  }, [ifcModel, key])

  return <group ref={groupRef} {...groupProps} />

  // useEffect(() => {
  //   const ifcLoader = new IFCLoader()
  //   ifcLoader.ifcManager.setWasmPath("../../../wasm/")
  //   ifcLoader.load(module.ifcUrl, (ifcModel) => scene.add(ifcModel))
  // }, [])

  // const { geometry, material, ifcManager, modelID } = useLoader(
  //   IFCLoader,
  //   module.ifcUrl,
  //   (loader) => {
  //     if (loader instanceof IFCLoader) {
  //       loader.ifcManager.setWasmPath("../../../wasm/")
  //     }
  //   }
  // )

  // useBVH(meshRef as any)

  // useEffect(() => {
  //   if (ifcManager === null) return
  //   ifcManager.setupThreeMeshBVH(
  //     acceleratedRaycast,
  //     computeBoundsTree,
  //     disposeBoundsTree
  //   )
  // }, [ifcManager])

  // useHelper(meshRef, MeshBVHVisualizer)

  // const fooMaterial = useMemo(
  //   () =>
  //     new MeshLambertMaterial({
  //       // transparent: true,
  //       // opacity: 0.6,
  //       color: 0xff88ff,
  //       depthTest: false,
  //     }),
  //   []
  // )

  // return (
  //   <group ref={groupRef} {...groupProps}>
  //     <mesh
  //       ref={meshRef}
  //       {...{ geometry, material }}
  //       onClick={({ faceIndex }) => {
  //         const group = groupRef.current
  //         if (!ifcManager || !faceIndex || !group) {
  //           // console.log({ ifcManager, faceIndex, group })
  //           return
  //         }
  //         const expressID = ifcManager.getExpressId(geometry, faceIndex)
  //         const ifcType = ifcManager.getIfcType(modelID, expressID)
  //       }}
  //     />
  //   </group>
  // )
}
export default IfcModule
