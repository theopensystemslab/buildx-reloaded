import { pipe } from "fp-ts/lib/function"
import { Option } from "fp-ts/lib/Option"
import { Module } from "@/server/data/modules"
import { keysFilter, useSystemModules } from "~/data/modules"
import { WindowType } from "@/server/data/windowTypes"
import { useSystemWindowTypes } from "~/data/windowTypes"
import { A, O, S } from "~/utils/functions"
import { getSide, Side } from "~/design/state/camera"
import {
  columnLayoutToDNA,
  HouseModuleIdentifier,
  layouts,
} from "~/design/state/layouts"
import siteCtx from "~/design/state/siteCtx"
import { useChangeModuleLayout } from "./layouts"
import { serializeLayoutsKey } from "../../../db/layouts"
import houses from "../houses"

export type WindowTypeOption = {
  label: string
  value: { windowType: string; houseDna: string[] }
  thumbnail?: string
}

export const useWindowOptions = ({
  houseId,
  columnIndex,
  levelIndex,
  gridGroupIndex,
}: HouseModuleIdentifier): {
  options: WindowTypeOption[]
  selected: WindowTypeOption["value"]
} => {
  const layoutsKey = serializeLayoutsKey({
    systemId: houses[houseId].systemId,
    dnas: houses[houseId].dnas,
  })

  const m =
    layouts[layoutsKey][columnIndex].gridGroups[levelIndex].modules[
      gridGroupIndex
    ].module

  const { systemId } = m

  const side: Side = siteCtx.houseId ? getSide(siteCtx.houseId) : "RIGHT"

  const systemModules = useSystemModules({ systemId })
  const windowTypes = useSystemWindowTypes({ systemId })

  const changeModule = useChangeModuleLayout({
    houseId,
    columnIndex,
    levelIndex,
    gridGroupIndex,
  })

  const options = pipe(
    systemModules,
    A.filter(
      keysFilter(
        [
          "sectionType",
          "positionType",
          "levelType",
          "stairsType",
          "internalLayoutType",
          "gridType",
          "gridUnits",
        ],
        m
      )
    ),
    A.filterMap((m) =>
      pipe(
        windowTypes,
        A.filter((x) => x.systemId === m.systemId),
        A.findFirstMap((wt): Option<[Module, WindowType]> => {
          switch (true) {
            case m.structuredDna.positionType === "END":
              return wt.code === m.structuredDna.windowTypeEnd
                ? O.some([m, wt])
                : O.none
            case side === "LEFT":
              return wt.code === m.structuredDna.windowTypeSide1 &&
                m.structuredDna.windowTypeSide2 ===
                  m.structuredDna.windowTypeSide2
                ? O.some([m, wt])
                : O.none

            case side === "RIGHT":
              return wt.code === m.structuredDna.windowTypeSide2 &&
                m.structuredDna.windowTypeSide1 ===
                  m.structuredDna.windowTypeSide1
                ? O.some([m, wt])
                : O.none
            default:
              return O.none
          }
        })
      )
    ),
    A.map(([m, wt]): WindowTypeOption => {
      return {
        label: wt.description,
        value: { houseDna: changeModule(m), windowType: wt.code },
        thumbnail: wt.imageUrl,
      }
    })
  )

  const eq = A.getEq(S.Eq)

  const selected = pipe(
    options,
    A.findFirstMap(({ value }) => {
      const houseDna = columnLayoutToDNA(layouts[layoutsKey])
      return eq.equals(value.houseDna, houseDna) ? O.some(value) : O.none
    }),
    O.getOrElse(() => {
      throw new Error("Selected window option not found in options")
      return undefined as any
    })
  )

  return { options, selected }
}
