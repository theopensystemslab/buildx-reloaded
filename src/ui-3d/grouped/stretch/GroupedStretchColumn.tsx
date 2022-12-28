import {
  ColumnLayoutKeyInput,
  getVanillaColumnKey,
  GridGroup,
  indicesToKey,
  PositionedColumn,
} from "@/hooks/layouts"
import { pipe } from "fp-ts/lib/function"
import { HandleSide, HandleSideEnum } from "@/hooks/gestures/drag/handles"
import { RA } from "@/utils/functions"
import GroupedStretchModule from "./GroupedStretchModule"
import { useSubscribeKey } from "../../../utils/hooks"
import postTransients from "../../../hooks/transients/post"
import { useRef } from "react"
import { Group } from "three"

type Props = {
  systemId: string
  houseId: string
  gridGroups: GridGroup[]
  side: HandleSide
  columnZ: number
}

const GroupedStretchColumn = (props: Props) => {
  const { systemId, houseId, gridGroups: rows, columnZ } = props

  const groupRef = useRef<Group>(null)

  useSubscribeKey(
    postTransients,
    houseId,
    () => {
      const { stretch } = postTransients[houseId] ?? {}
      if (!stretch) {
        groupRef.current?.scale.set(0, 0, 0)
        return
      }

      const { distance, side } = stretch

      if (side !== props.side) return

      if (side === HandleSideEnum.Enum.BACK && distance > columnZ) {
        groupRef.current?.scale.set(1, 1, 1)
      } else if (side === HandleSideEnum.Enum.FRONT && distance < columnZ) {
        groupRef.current?.scale.set(1, 1, 1)
      } else {
        groupRef.current?.scale.set(0, 0, 0)
      }
    },
    true
  )

  return (
    <group ref={groupRef}>
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
