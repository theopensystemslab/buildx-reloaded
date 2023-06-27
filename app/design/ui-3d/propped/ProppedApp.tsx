"use client"
import { pipe } from "fp-ts/lib/function"
import { Fragment, Suspense } from "react"
import { usePreviews } from "~/design/state/previews"
import { useRouting } from "~/design/state/routing"
import { A, NEA, RA } from "~/utils/functions"
import { useExportersWorker } from "../../workers/exporters"
import { useDragHandler, useGestures } from "../../state/gestures"
import { useHouseKeys } from "../../state/houses"
import XZPlane from "../XZPlane"
import YPlane from "../YPlane"
import { useLiveQuery } from "dexie-react-hooks"
import userDB from "../../../db/user"
import { systems } from "../../../../server/data/system"
import systemsDB from "../../../db/systems"
import Loader from "../../../ui/Loader"
import ProppedSystem from "./ProppedSystem"
import { useKey } from "react-use"
// import GroupedHouse from "./GroupedHouse"

const ProppedApp = () => {
  // const houses = useLiveQuery(() => userDB.houses.toArray())  ?? []
  // const houseKeys = useHouseKeys()
  // usePreviews()
  // const bindAll = useGestures()
  // useDragHandler()
  // useRouting()

  // useExportersWorker()

  const result = useLiveQuery(async () => ({
    modules: pipe(
      await systemsDB.modules.toArray(),
      NEA.groupBy((x) => x.systemId)
    ),
    models: pipe(
      await systemsDB.models.toArray(),
      NEA.groupBy((x) => x.speckleBranchUrl)
    ),
  }))

  if (!result) return null

  const { modules, models } = result

  return (
    <Fragment>
      <group
      // {...bindAll()}
      >
        {pipe(
          systems,
          A.map((system) => (
            <ProppedSystem
              key={system.id}
              systemId={system.id}
              modules={modules[system.id]}
              models={models}
            />
          ))
        )}
        {/* {pipe(
          houses,
          RA.map((house) => (
            <Suspense key={house.id} fallback={null}>
              <houseId={house.id} />
            </Suspense>
          ))
        )} */}
      </group>
      <XZPlane />
      <YPlane />
    </Fragment>
  )
}

export default ProppedApp
