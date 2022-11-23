import { proxy } from "valtio"
import { Transforms } from "./houses"

const transients = proxy<Record<string, Transforms>>({})

export default transients
