import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { useEffect, useRef } from "react"
import { Group } from "three"
import { RA } from "~/utils/functions"
import { GridGroup, HouseLayoutsKey } from "../../../../db/layouts"
import { getLayoutsWorker } from "../../../../workers"
import { useZStretchHouseListener } from "../../../state/events/stretch"
import GroupedStretchModule from "./GroupedStretchModule"

type Props = {
  systemId: string
  houseId: string
  gridGroups: GridGroup[]
  direction: number
  columnZ: number
  columnLength: number
  i: number
  layoutKey: HouseLayoutsKey
}

const GroupedStretchColumn = (props: Props) => {
  const {
    systemId,
    houseId,
    gridGroups: rows,
    columnZ,
    columnLength,
    i,
    direction,
    layoutKey,
  } = props

  const groupRef = useRef<Group>(null)

  useEffect(() => {
    const layoutsWorker = getLayoutsWorker()
    if (!layoutsWorker) {
      console.log("no layouts workers")
      return
    }
    layoutsWorker.processZStretchLayout({ direction, i, layoutKey })
  }, [direction, houseId, i, layoutKey])

  useZStretchHouseListener((detail) => {
    if (houseId !== detail.houseId) return

    const { distance, direction, dx, dz, last } = detail

    // if (!stretchLengthClamped[houseId]) {
    //   groupRef.current?.scale.set(0, 0, 0)
    //   return
    // }

    if (direction !== props.direction) return

    if (direction === 1 && distance + columnLength / 2 > columnZ) {
      groupRef.current?.scale.set(1, 1, 1)
    } else if (direction === -1 && distance + columnLength / 2 < columnZ) {
      groupRef.current?.scale.set(1, 1, 1)
    } else {
      // groupRef.current?.scale.set(0, 0, 0)
    }

    invalidate()
  })

  useEffect(() => {
    groupRef.current?.scale.set(1, 1, 1)
  }, [])

  return (
    <group ref={groupRef} scale={[0, 0, 0]}>
      {pipe(
        rows,
        RA.chain(({ modules, levelIndex, y: levelY }) =>
          pipe(
            modules,
            RA.map(({ module, gridGroupIndex, z: moduleZ }) => {
              return (
                <group
                  key={`${gridGroupIndex}:${module.dna}`}
                  position={[0, levelY, 0]}
                >
                  <GroupedStretchModule
                    {...{
                      systemId,
                      houseId,
                      module,
                      levelIndex,
                      gridGroupIndex,
                      levelY,
                      moduleZ,
                      mirror: true,
                    }}
                  />
                </group>
              )
            })
          )
        )
      )}
    </group>
  )
}

export default GroupedStretchColumn
