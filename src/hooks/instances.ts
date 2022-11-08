// key with a hash

import { proxyMap } from "valtio/utils"

// it's just geom and material hashes

type GeometryMaterialHash = string

export const getGeometryMaterialHash = () => ""

type ModuleElementInstanceData = {
  systemId: string
  houseId: string
  columnIndex: number
  levelIndex: number
  gridGroupIndex: number
  position: V3
  rotation: number
}

const moduleElementInstances = proxyMap<
  GeometryMaterialHash,
  Array<ModuleElementInstanceData>
>()

export default moduleElementInstances
