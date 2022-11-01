import { Instance, Instances } from "@react-three/drei"
import { pipe } from "fp-ts/lib/function"
import React, { Fragment } from "react"
import {
  ColumnLayout,
  useColumnLayout,
  useInstancedColumnLayout,
} from "../../hooks/layouts"
import { useIsBuilding, useSiteCtx } from "../../hooks/siteCtx"
import { RA, RR } from "../../utils/functions"

type Props = {
  id: string
}

type Desired = {}

const f = (input: ColumnLayout): Desired =>
  pipe(
    input,
    RA.reduce({}, (acc, v) => acc)
  )

const InstancedHouse = (props: Props) => {
  const { id } = props

  const {} = useSiteCtx()

  const isBuilding = useIsBuilding(id)

  const instancedColumnLayout = useInstancedColumnLayout(id)

  // so you've got { dna : modules[] }

  // for each dna

  // let's have an instanced mesh and instance the modules

  // (depending on geometryMerge but whatever for now)

  return (
    <Fragment>
      {pipe(
        instancedColumnLayout,
        RR.keys,
        RA.map((dna) => (
          <Instances key={dna}>
            <boxGeometry />
            <meshStandardMaterial />
            {pipe(
              instancedColumnLayout[dna],
              RA.map(
                ({ y, z, columnIndex, levelIndex, gridGroupIndex, module }) => (
                  <Instance
                    key={`${dna}:${columnIndex}-${levelIndex}-${gridGroupIndex}:${module.dna}`}
                    position={[0, y, z]}
                  />
                )
              )
            )}
          </Instances>
        ))
      )}
    </Fragment>
  )
}

export default InstancedHouse
