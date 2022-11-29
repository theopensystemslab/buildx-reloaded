import { proxy } from "valtio"
import { Transients } from "./common"

const postTransients = proxy<Transients>({})

export default postTransients
