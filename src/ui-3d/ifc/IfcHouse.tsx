import { useColumnLayout } from "@/hooks/layouts"
import { useGesture } from "@use-gesture/react"
import { useEffect } from "react"
import { subscribe } from "valtio"
import { IFCPROJECT, IFCWALL } from "web-ifc"
import ifc, { models } from "../../hooks/ifc"
import { subscribeMapKey } from "../../utils/valtio"
import IfcColumn from "./IfcColumn"

type Props = {
  id: string
}

const IfcHouse = (props: Props) => {
  const { id } = props
  const columns = useColumnLayout(id)

  const bind = useGesture({
    onDrag: ({ first, last }) => {
      if (first) console.log("first")
      console.log("dragging")
      if (last) console.log("last")
    },
  })

  // useEffect(() => {
  //   console.log("called effect")
  //   const ifcUrl0 = columns?.[0]?.gridGroups?.[0].modules?.[0].module.ifcUrl
  //   subscribeMapKey(models, ifcUrl0, async () => {
  //     console.log("called sub")
  //     const model = models.get(ifcUrl0)
  //     if (!model) return
  //     console.log(model)
  //     console.log(model.types)
  //     // const items = await ifc.loader.ifcManager.getAllItemsOfType(
  //     //   model.modelID,
  //     //   0,
  //     //   false
  //     // )
  //     // console.log(items)
  //   })
  // }, [columns])

  // useEffect(() => {
  //   console.log("called")
  //   const ifcUrl0 = columns?.[0]?.gridGroups?.[0].modules?.[0].module.ifcUrl
  //   console.log(ifcUrl0)
  //   const model = models.get(ifcUrl0)
  //   if (!model) return
  //   const space = ifc.loader.ifcManager.getSpatialStructure(model.modelID)
  //   console.log(space)
  // }, [columns])

  return (
    <group {...(bind() as any)}>
      {columns.map(({ columnIndex, z, gridGroups }) => {
        return (
          <IfcColumn
            key={columnIndex}
            houseId={id}
            columnIndex={columnIndex}
            columnZ={z}
            gridGroups={gridGroups}
            verticalCutPlanes={[]}
            mirror={columnIndex === columns.length - 1}
          />
        )
      })}
    </group>
  )
}

export default IfcHouse
