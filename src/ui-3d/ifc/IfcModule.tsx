import { Module } from "@/data/module"
import ifcStore, { pushIfcModel, useIfcLoader } from "@/hooks/ifcStore"
import { GroupProps, useLoader } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import { Group, Plane } from "three"
import { ref, subscribe } from "valtio"
import { IFCLoader } from "web-ifc-three"
import { suspend } from "suspend-react"
import { IFCModel } from "web-ifc-three/IFC/components/IFCModel"
import { subscribeKey } from "valtio/utils"
import globals from "../../hooks/globals"
import { IfcMesh } from "web-ifc-three/IFC/BaseDefinitions"

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

  const loader = useIfcLoader()
  const manager = loader.ifcManager

  const ifcModel = suspend(async () => {
    const ifcModel: IFCModel = await loader.loadAsync(module.ifcUrl)

    console.log(manager.state.models)

    pushIfcModel(key, ifcModel)

    return ifcModel
  }, [module.ifcUrl, key])

  useEffect(() =>
    subscribeKey(globals, "intersection", () => {
      if (!groupRef.current) return
      const { intersection } = globals
      if (intersection === null) return
      if (typeof intersection.faceIndex === "undefined") return

      const mesh = intersection.object as IfcMesh
      const modelID = mesh.modelID
      if (modelID !== ifcModel.modelID) return

      // @ts-ignore
      manager.state.models[modelID] = mesh

      const expressID = manager.getExpressId(
        mesh.geometry,
        intersection.faceIndex
      )

      manager.createSubset({
        scene: groupRef.current,
        ids: [expressID],
        modelID,
        removePrevious: true,
        material: ifcStore.highlightMaterial,
      })
    })
  )

  return (
    <group ref={groupRef} {...groupProps}>
      <primitive object={ifcModel} />
    </group>
  )

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
