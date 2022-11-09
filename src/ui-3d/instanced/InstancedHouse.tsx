import houses from "@/hooks/houses"
import { indicesToKey, useColumnLayout } from "@/hooks/layouts"
import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { RA } from "../../utils/functions"
import InstancedModule from "./InstancedModule"

type Props = {
  houseId: string
}

const InstancedHouse = (props: Props) => {
  const { houseId } = props
  const systemId = houses[houseId].systemId
  const columnLayout = useColumnLayout(houseId)

  const children = pipe(
    columnLayout,
    RA.chain(({ columnIndex, gridGroups, z: columnZ }) =>
      pipe(
        gridGroups,
        RA.chain(({ modules, levelIndex, y: levelY }) =>
          pipe(
            modules,
            RA.map(({ module, gridGroupIndex, z: moduleZ }) => {
              return (
                <InstancedModule
                  key={indicesToKey({
                    systemId,
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
                    columnZ,
                    levelY,
                    moduleZ,
                    mirror: columnIndex === columnLayout.length - 1,
                  }}
                />
              )
            })
          )
        )
      )
    )
  )

  return <Fragment>{children}</Fragment>
}

export default InstancedHouse
