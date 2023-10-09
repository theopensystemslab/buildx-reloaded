import { pipe } from "fp-ts/lib/function"
import { Fragment, useMemo, useState } from "react"
import { System, systems } from "../../../server/data/system"
import { useAllHouseTypes } from "../../db/systems"
import Sidebar from "../../ui/Sidebar"
import { A } from "../../utils/functions"
import { setSidebar, useDesignSettings } from "../state/settings"
import HouseThumbnail from "./HouseThumbnail"

const ObjectsSidebar = () => {
  const { sidebar } = useDesignSettings()

  const close = () => void setSidebar(false)

  const houseTypes = useAllHouseTypes()

  // const [selectedSystemId, setSelectedSystemId] = useState<string | null>(
  //   singleSystem ? systems[0].id : null
  // )

  // const selectedSystem: System | undefined = useMemo(() => {
  //   return systems.find((system) => system.id === selectedSystemId)
  // }, [selectedSystemId])

  // we want this to be open if there aren't any houses in play

  //  but we need to load first

  // event driven so take a trigger

  return (
    <Sidebar expanded={sidebar && houseTypes.length > 0} onClose={close}>
      {pipe(
        houseTypes,
        A.map((houseType) => (
          <HouseThumbnail key={houseType.id} houseType={houseType} />
        ))
      )}
    </Sidebar>
  )
}

export default ObjectsSidebar
