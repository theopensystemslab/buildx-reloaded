import { indicesToKey, PositionedColumn } from "@/hooks/layouts"
import { RA } from "@/utils/functions"
import { GroupProps } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { forwardRef, useRef } from "react"
import mergeRefs from "react-merge-refs"
import { Group } from "three"
import PreviewModule from "./PreviewModule"

type Props = GroupProps & {
  systemId: string
  houseId: string
  column: PositionedColumn
  start?: boolean
  end?: boolean
}

const PreviewColumn = forwardRef<Group, Props>((props, ref) => {
  const {
    systemId,
    houseId,
    column: { gridGroups, columnIndex, z: columnZ },
    start = false,
    end = false,
  } = props

  const groupRef = useRef<Group>(null)

  const mergedRef = mergeRefs([ref, groupRef])

  return (
    <group ref={mergedRef} key={columnIndex} position-z={columnZ}>
      {pipe(
        gridGroups,
        RA.chain(({ modules, levelIndex, y: levelY }) =>
          pipe(
            modules,
            RA.map(({ module, gridGroupIndex, z: moduleZ }) => {
              return (
                <PreviewModule
                  key={indicesToKey({
                    houseId,
                    columnIndex,
                    levelIndex,
                    gridGroupIndex,
                  })}
                  {...{
                    systemId,
                    houseId,
                    module,
                    columnIndex,
                    levelIndex,
                    gridGroupIndex,
                    // columnZ,
                    levelY,
                    moduleZ,
                    startColumn: start,
                    endColumn: end,
                  }}
                />
              )
            })
          )
        )
      )}
    </group>
  )
})

export default PreviewColumn
