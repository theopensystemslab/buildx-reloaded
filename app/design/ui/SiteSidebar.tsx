import { System, systems } from "@/server/data/system"
import { useLiveQuery } from "dexie-react-hooks"
import { mapWithIndex } from "fp-ts/lib/ReadonlyArray"
import { pipe } from "fp-ts/lib/function"
import { Fragment, useMemo, useState } from "react"
import Sidebar from "~/ui//Sidebar"
import systemsDB from "../../db/systems"
import { dispatchAddHouseIntent } from "../ui-3d/fresh/events/houses"
import HouseThumbnail from "./HouseThumbnail"

type Props = {
  open: boolean
  close: () => void
}

const SiteSidebar = ({ open, close }: Props) => {
  const houseTypes = useLiveQuery(() => systemsDB.houseTypes.toArray())

  const manySystems = systems.length > 1
  const singleSystem = systems.length === 1

  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(
    singleSystem ? systems[0].id : null
  )

  const selectedSystem: System | undefined = useMemo(() => {
    return systems.find((system) => system.id === selectedSystemId)
  }, [selectedSystemId])

  return (
    <Sidebar expanded={open} onClose={close}>
      {manySystems && !selectedSystem ? (
        <div className="space-y-2">
          <p className="px-4 font-bold">Systems</p>
          {systems.map((system) => (
            <button
              key={system.id}
              className="block w-full cursor-pointer px-4 py-2 text-left hover:bg-grey-10"
              onClick={() => {
                setSelectedSystemId(system.id)
              }}
            >
              {system.name}
            </button>
          ))}
        </div>
      ) : selectedSystem ? (
        <div className="space-y-2">
          {manySystems && (
            <button
              className="sticky top-2 ml-4 rounded bg-white px-2 py-2 text-xs text-grey-50 hover:text-grey-60"
              onClick={() => {
                setSelectedSystemId(null)
              }}
            >
              ← Back
            </button>
          )}
          <p className="px-4 font-bold">{selectedSystem.name} House types</p>
          {typeof houseTypes !== "undefined" ? (
            <Fragment>
              {pipe(
                houseTypes,
                mapWithIndex((index, houseType) => {
                  return houseType.systemId === selectedSystem.id ? (
                    <HouseThumbnail
                      key={index}
                      houseType={houseType}
                      onAdd={() => {
                        dispatchAddHouseIntent(houseType)

                        // dispatchAddHouseIntent({
                        //   id,
                        //   houseTypeId: houseType.id,
                        //   systemId: houseType.systemId,
                        //   position,
                        //   rotation: 0,
                        //   dnas: houseType.dnas,
                        //   modifiedMaterials: {},
                        //   friendlyName: `Building ${
                        //     Object.keys(houses).length + 1
                        //   }`,
                        // })

                        close()
                      }}
                    />
                  ) : null
                })
              )}
            </Fragment>
          ) : null}
        </div>
      ) : null}
    </Sidebar>
  )
}

export default SiteSidebar
