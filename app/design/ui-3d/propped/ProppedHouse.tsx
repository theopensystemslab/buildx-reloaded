import React from "react"
import { IndexedModel, IndexedModule } from "../../../db/systems"
import { House } from "../../../db/user"

type Props = {
  house: House
  modules: IndexedModule[]
  models: Record<string, IndexedModel[]>
}

const ProppedHouse = (props: Props) => {
  const { house } = props
  console.log(house)
  return <group name={house.id}></group>
}

export default ProppedHouse
