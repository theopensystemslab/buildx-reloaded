import { useLiveQuery } from "dexie-react-hooks"
import { pipe } from "fp-ts/lib/function"
import { IndexedModel, IndexedModule } from "../../../db/system"
import userDB from "../../../db/user"
import { A } from "../../../utils/functions"
import ProppedHouse from "./ProppedHouse"

type Props = {
  systemId: string
  modules: IndexedModule[]
  models: Record<string, IndexedModel[]>
}

const ProppedSystem = (props: Props) => {
  const { systemId, modules, models } = props

  const houses =
    useLiveQuery(() =>
      userDB.houses.filter((x) => x.systemId === systemId).toArray()
    ) ?? []

  console.log(houses)

  return (
    <group>
      {pipe(
        houses,
        A.map((house) => (
          <ProppedHouse
            key={house.id}
            house={house}
            modules={modules}
            models={models}
          />
        ))
      )}
    </group>
  )
}

export default ProppedSystem
