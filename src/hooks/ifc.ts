import { proxy } from "valtio"
import { IFCModel } from "web-ifc-three/IFC/components/IFCModel"

export type IFCStore = {
  models: IFCModel[]
}

export const ifcStore = proxy<IFCStore>({
  models: [],
})

export default ifcStore
