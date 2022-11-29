import { proxy } from "valtio"
import { Transients } from "./common"

const preTransients = proxy<Transients>({})

export default preTransients
