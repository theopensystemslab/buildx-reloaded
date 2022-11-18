import { pipe } from "fp-ts/lib/function"
import { Fragment, useState } from "react"
import { useDimensions } from "../../hooks/dimensions"
import { useHandleDragStart } from "../../hooks/drag/handles"
import houses, { useHouse } from "../../hooks/houses"
import { useStretch } from "../../hooks/layouts"
import { EditModeEnum } from "../../hooks/siteCtx"
import { NEA, RA, RNEA } from "../../utils/functions"
import StretchInstanceColumn from "./StretchInstanceColumn"

const StretchInstancesMain = ({ houseId }: { houseId: string }) => {
  const { startColumn, endColumn, vanillaColumn } = useStretch(houseId)

  const house = useHouse(houseId)

  const vanillaColumnLength = vanillaColumn[0].length
  const { length: houseLength } = useDimensions(houseId)
  const maxLength = 50
  const maxCount = (maxLength - houseLength) / vanillaColumnLength

  const systemId = houses[houseId].systemId

  // const MIN = -10
  // const MAX = 10
  // const COUNT = (MAX - MIN) / gridGroups.length

  // console.log(COUNT)

  // const indices = RNEA.range(0, COUNT - 1)
  const endZ = house.position.z + houseLength - endColumn.length

  const columnsUp = pipe(
    NEA.range(0, maxCount - 1),
    NEA.map((i) => (
      <StretchInstanceColumn
        key={i}
        {...{
          gridGroups: vanillaColumn,
          systemId,
          houseId,
          columnZ: endZ + i * vanillaColumnLength,
        }}
      />
    ))
  )
  // const columnsDown = pipe()

  return (
    <Fragment>
      {columnsUp}
      {/* {pipe(
        indices,
        RA.map((i) => (
        ))
      )} */}
    </Fragment>
  )

  // return (
  //   <Instances>
  //     <boxBufferGeometry />
  //     <meshBasicMaterial />
  //   </Instances>
  // )
  // console.log({ vanillaColumn })

  // prob wanna destructure the z's from here with the layout

  // z before end column starts
  // z after start column ends
  // big z (upper limit)
  // negative big z (lower limit)
  // map instances

  // reduce geometry-material sets the same way as in Element

  // need each module's local position
  // need each element's geometry

  // const renderColumn = ({
  //   columnIndex,
  //   gridGroups,
  //   z: columnZ,
  // }: PositionedColumn) => (
  //   <Fragment key={columnIndex}>
  //     {pipe(
  //       gridGroups,
  //       RA.chain(({ modules, levelIndex, y: levelY }) =>
  //         pipe(
  //           modules,
  //           RA.map(({ module, gridGroupIndex, z: moduleZ }) => {
  //             return (
  //               <DefaultModule
  //                 key={indicesToKey({
  //                   systemId,
  //                   houseId,
  //                   columnIndex,
  //                   levelIndex,
  //                   gridGroupIndex,
  //                 })}
  //                 {...{
  //                   systemId,
  //                   houseId,
  //                   module,
  //                   columnIndex,
  //                   levelIndex,
  //                   gridGroupIndex,
  //                   columnZ,
  //                   levelY,
  //                   moduleZ,
  //                   mirror: true,
  //                 }}
  //               />
  //             )
  //           })
  //         )
  //       )
  //     )}
  //   </Fragment>
  // )
}

const StretchInstances = () => {
  const handleDragStart = useHandleDragStart()
  return handleDragStart === null ||
    handleDragStart.handleIdentifier.editMode !==
      EditModeEnum.Enum.STRETCH ? null : (
    <StretchInstancesMain houseId={handleDragStart.handleIdentifier.houseId} />
  )
}

export default StretchInstances
