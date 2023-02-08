import { transpose } from "fp-ts-std/Array"
import { pipe } from "fp-ts/lib/function"
import React, { Fragment } from "react"
import { useGetStairsModule, usePadColumn } from "../../data/modules"
import houses from "../../hooks/houses"
import {
  columnMatrixToDna,
  HouseModuleIdentifier,
  rowMatrixToDna,
  useColumnMatrix,
} from "../../hooks/layouts"
import { useGetVanillaModule } from "../../hooks/vanilla"
import { A, errorThrower, O } from "../../utils/functions"
import { AddLevel, RemoveLevel, Opening } from "../icons"
import Radio from "../Radio"
import ContextMenuButton from "./ContextMenuButton"
import ContextMenuNested from "./ContextMenuNested"

type Props = HouseModuleIdentifier & {
  onComplete?: () => void
}

const AddRemoveLevels = (props: Props) => {
  const { houseId, levelIndex, onComplete } = props
  const systemId = houses[houseId].systemId
  const columnMatrix = useColumnMatrix(houseId)

  const getVanillaModule = useGetVanillaModule(systemId)
  const getStairsModule = useGetStairsModule(systemId)
  const padColumn = usePadColumn(systemId)

  const getLevel = (i: number) =>
    pipe(columnMatrix, transpose, A.lookup(i), O.toNullable)

  const thisLevel = getLevel(levelIndex)
  const nextLevel = getLevel(levelIndex + 1)

  if (thisLevel === null) throw new Error("thisLevel null")

  const thisLevelLetter = thisLevel[0][0].structuredDna.levelType[0]
  const nextLevelLetter = nextLevel?.[0][0].structuredDna.levelType[0]

  const targetLevelLetter = nextLevelLetter === "R" ? "T" : "M"
  const targetLevelType = targetLevelLetter + "1"

  const canAddFloorAbove =
    nextLevel !== null && ["R", "M", "T"].includes(targetLevelLetter)

  const canRemoveFloor = ["M", "T"].includes(thisLevelLetter)

  const addFloorAbove = () => {
    if (!canAddFloorAbove) return

    houses[houseId].dna = pipe(
      columnMatrix,
      transpose,
      (rows) => [
        ...rows.slice(0, levelIndex + 1),
        pipe(
          rows[levelIndex],
          A.map((group) =>
            pipe(
              group,
              A.map((m) => {
                const vanillaModule = pipe(
                  getVanillaModule(m, {
                    levelType: targetLevelType,
                  })
                )

                if (m.structuredDna.stairsType === "ST0")
                  return A.replicate(
                    m.structuredDna.gridUnits /
                      vanillaModule.structuredDna.gridUnits,
                    vanillaModule
                  )
                const stairsModule = pipe(
                  getStairsModule(m, {
                    levelType: targetLevelType,
                  }),
                  errorThrower(
                    `No stairs module found for ${m.dna} level ${targetLevelLetter}`
                  )
                )
                return [stairsModule]
              }),
              A.flatten
            )
          )
        ),
        ...rows.slice(levelIndex + 1),
      ],
      transpose,
      A.map(padColumn),
      columnMatrixToDna
    )
    onComplete?.()
  }

  const removeFloor = () => {
    if (!canRemoveFloor) return

    houses[houseId].dna = pipe(
      columnMatrix,
      transpose,
      (rows) => [...rows.slice(0, levelIndex), ...rows.slice(levelIndex + 1)],
      A.map(A.flatten),
      rowMatrixToDna
    )
    onComplete?.()
  }

  return (
    <Fragment>
      {canAddFloorAbove && (
        <ContextMenuButton
          onClick={addFloorAbove}
          icon={<AddLevel />}
          text="Add level"
          unpaddedSvg
        />
      )}
      {canRemoveFloor && (
        <ContextMenuButton
          onClick={removeFloor}
          icon={<RemoveLevel />}
          text="Remove level"
          unpaddedSvg
        />
      )}
    </Fragment>
  )
}

export default AddRemoveLevels
