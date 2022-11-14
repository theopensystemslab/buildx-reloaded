import houses from "@/hooks/houses"
import {
  indicesToKey,
  PositionedColumn,
  useColumnLayout,
} from "@/hooks/layouts"
import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { useDimensionsSubscription } from "../../hooks/dimensions"
import { splitColumns } from "../../hooks/stretch"
import { RA } from "../../utils/functions"
import DefaultModule from "./DefaultModule"

type Props = {
  houseId: string
}

const DefaultHouse = (props: Props) => {
  const { houseId } = props
  const systemId = houses[houseId].systemId

  const columnLayout = useColumnLayout(houseId)

  const { startColumn, midColumns, endColumn } = splitColumns(columnLayout)

  useDimensionsSubscription(houseId, columnLayout)

  const renderColumn = (
    { columnIndex, gridGroups }: PositionedColumn,
    userData: { startColumn?: boolean; endColumn?: boolean } = {
      startColumn: false,
      endColumn: false,
    }
  ) => (
    <Fragment key={columnIndex}>
      {pipe(
        gridGroups,
        RA.chain(({ modules, levelIndex, y: levelY }) =>
          pipe(
            modules,
            RA.map(({ module, gridGroupIndex, z: moduleZ }) => {
              return (
                <DefaultModule
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
                    ...userData,
                    // columnZ,
                    // levelY,
                    // moduleZ,
                    // mirror: columnIndex === columnLayout.length - 1,
                  }}
                />
              )
            })
          )
        )
      )}
    </Fragment>
  )

  return (
    <Fragment>
      <Fragment>{renderColumn(startColumn, { startColumn: true })}</Fragment>
      <Fragment>{pipe(midColumns, RA.map(renderColumn))}</Fragment>
      <Fragment>{renderColumn(endColumn, { endColumn: true })}</Fragment>
    </Fragment>
  )

  // const children = pipe(
  //   columnLayout,
  //   RA.chain(({ columnIndex, gridGroups, z: columnZ }) =>
  //   )
  // )

  // return <Fragment>{children}</Fragment>
}

export default DefaultHouse
