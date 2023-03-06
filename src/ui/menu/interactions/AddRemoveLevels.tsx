import { transpose } from "fp-ts-std/Array"
import { pipe } from "fp-ts/lib/function"
import { Fragment, useEffect, useMemo } from "react"
import { ref } from "valtio"
import { useGetStairsModule, usePadColumn } from "@/data/modules"
import houses from "@/hooks/houses"
import {
  columnMatrixToDna,
  HouseModuleIdentifier,
  rowMatrixToDna,
  useColumnMatrix,
} from "@/hooks/layouts"
import previews from "@/hooks/previews"
import { useGetVanillaModule } from "@/hooks/vanilla"
import { A, errorThrower, O } from "@/utils/functions"
import { AddLevel, RemoveLevel } from "@/ui/icons"
import ContextMenuButton from "../common/ContextMenuButton"

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

  const floorAboveDna = useMemo(() => {
    if (!canAddFloorAbove) return []

    return pipe(
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
  }, [
    canAddFloorAbove,
    columnMatrix,
    getStairsModule,
    getVanillaModule,
    levelIndex,
    padColumn,
    targetLevelLetter,
    targetLevelType,
  ])

  const key = floorAboveDna.toString()

  const addFloorAbove = () => {
    if (!canAddFloorAbove) return

    houses[houseId].dna = floorAboveDna
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

  useEffect(() => {
    if (!canAddFloorAbove) return

    previews[houseId].dna[key] = {
      active: false,
      value: ref(floorAboveDna),
    }

    return () => {
      delete previews[houseId].dna[key]
    }
  }, [canAddFloorAbove, floorAboveDna, houseId, key])

  return (
    <Fragment>
      {canAddFloorAbove && (
        <ContextMenuButton
          onClick={addFloorAbove}
          onHover={(hovered) => {
            previews[houseId].dna[key].active = hovered
          }}
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
