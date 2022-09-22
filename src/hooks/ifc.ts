import { proxy } from "valtio"
import { IFCModel } from "web-ifc-three/IFC/components/IFCModel"

type Models = Record<string, IFCModel>

export type IFCStore = {
  models: Models
}

export const ifcStore = proxy<IFCStore>({
  models: {},
})

export default ifcStore
