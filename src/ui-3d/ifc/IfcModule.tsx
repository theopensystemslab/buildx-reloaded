import { Module } from "@/data/module"
import ifcStore, { pushIfcModel, useIfcLoader } from "@/hooks/ifcStore"
import { GroupProps, ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { useRef } from "react"
import { suspend } from "suspend-react"
import { Group, Plane } from "three"
import { IFCModel } from "web-ifc-three/IFC/components/IFCModel"

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

    pushIfcModel(key, ifcModel)

    return ifcModel
  }, [module.ifcUrl, key])

  const bind = useGesture<{ onClick: ThreeEvent<PointerEvent> }>({
    onClick: ({ event: { intersections } }) => {
      if (!groupRef.current) return
      const ix = intersections?.[0]
      const object = ix?.object as IFCModel
      if (!("modelID" in object)) return

      const modelID = object.modelID

      if (!(modelID in manager.state.models && modelID === ifcModel.modelID)) {
        console.log(modelID)
        manager.state.models[modelID] = ifcModel as any
      }

      const expressID = manager.getExpressId(object.geometry, ix.faceIndex!)

      manager.createSubset({
        scene: groupRef.current,
        ids: [expressID],
        modelID,
        removePrevious: false,
        material: ifcStore.highlightMaterial,
      })
    },
  })

  return (
    <group ref={groupRef} {...groupProps} {...(bind() as any)}>
      <primitive object={ifcModel} />
    </group>
  )
}
export default IfcModule
