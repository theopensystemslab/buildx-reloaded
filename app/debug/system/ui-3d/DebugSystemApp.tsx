"use client"
import { pipe } from "fp-ts/lib/function"
import { Fragment, Suspense } from "react"
import { systems } from "../../../../server/data/system"
import { A, O, S } from "../../../utils/functions"
import { useControls } from "leva"
import DebugSpeckleModule from "./DebugSpeckleModule"
import { useAllModules } from "../../../db/systems"

const DebugSystemApp = () => {
  const allModules = useAllModules()

  const { system } = useControls({
    system: {
      options: systems.map((x) => x.id),
      value: systems[0].id,
    },
    // ifc: false,
  }) as {
    system: string
    ifc: boolean
  }

  const moduleOptions = pipe(
    allModules,
    A.filterMap((module) =>
      module.systemId === system ? O.some(module.dna) : O.none
    ),
    A.uniq(S.Eq),
    A.sort(S.Ord)
  )

  const { moduleDna } = useControls(
    {
      moduleDna: {
        options: moduleOptions,
        value: moduleOptions[0],
      },
    },
    [system]
  )

  return (
    <Fragment>
      {pipe(
        allModules,
        A.findFirstMap((module) =>
          module.systemId === system && module.dna === moduleDna
            ? O.some(
                <Suspense key={moduleDna} fallback={null}>
                  <DebugSpeckleModule module={module} />
                </Suspense>
              )
            : O.none
        ),
        O.toNullable
      )}
    </Fragment>
  )
}

export default DebugSystemApp
