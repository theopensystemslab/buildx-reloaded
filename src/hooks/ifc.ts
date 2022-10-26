import { proxyMap } from "valtio/utils"
import { IfcModel } from "web-ifc-three/IFC/BaseDefinitions"
import { Subset } from "web-ifc-three/IFC/components/subsets/SubsetManager"

export const getModelKey = (houseId: string, dna: string) => `${houseId}:${dna}`

export const models = proxyMap<string, IfcModel>()

export const getSubsetKey = () => {}

export const subsets = proxyMap<string, Subset>()

export const useSubset = () => {
  const model = models.get("foo")
  const subset = subsets.get("foo")

  // layout info may be available within tree
}
