import { Module } from "@/server/data/modules"
import { liveQuery } from "dexie"
import * as A from "fp-ts/Array"
import { pipe } from "fp-ts/lib/function"
import { proxy, ref } from "valtio"
import { usePadColumn } from "../../data/modules"
import layoutsDB, {
  ColumnLayout,
  HouseModuleIdentifier,
  getHouseLayoutsKey,
} from "../../db/layouts"
import { isSSR } from "../../utils/next"

export const layouts = proxy<
  Record<string, ColumnLayout> // systemId:dnas : Layout
>({})

if (!isSSR()) {
  liveQuery(() => layoutsDB.houseLayouts.toArray()).subscribe((dbLayouts) => {
    for (let { systemId, dnas, layout } of dbLayouts) {
      const layoutsKey = getHouseLayoutsKey({ systemId, dnas })
      if (!(layoutsKey in layouts)) {
        layouts[layoutsKey] = ref(layout)
      }
    }
  })
}

export const usePadColumnMatrix = (systemId: string) => {
  const padColumn = usePadColumn(systemId)
  return (columnMatrix: Module[][][]) => pipe(columnMatrix, A.map(padColumn))
}

export const indicesToKey = ({
  houseId,
  columnIndex,
  levelIndex,
  gridGroupIndex,
}: HouseModuleIdentifier) =>
  `${houseId}:${columnIndex},${levelIndex},${gridGroupIndex}`
