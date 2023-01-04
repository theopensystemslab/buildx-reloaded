import { A } from "../../utils/functions"
import { sign } from "../../utils/math"
import { HandleSideEnum } from "../gestures/drag/handles"
import houses from "../houses"
import { columnLayoutToDNA, layouts } from "../layouts"
import { getVanillaColumnLength, vanillaColumns } from "../vanilla"
import { splitColumns, stretchLength } from "./stretch"
import { postTransformsTransients, preTransformsTransients } from "./transforms"

export const setStretch = () => {
  for (let houseId of Object.keys(stretchLength)) {
    const layout = layouts[houseId]
    const { startColumn, midColumns, endColumn } = splitColumns(layout)
    const vanillaColumn = vanillaColumns[houseId]
    const vanillaColumnLength = getVanillaColumnLength(vanillaColumn)
    const { side, distance, dx, dz } = stretchLength[houseId]
    const delta = distance / vanillaColumnLength

    switch (side) {
      case HandleSideEnum.Enum.BACK: {
        if (sign(delta) === 1) {
          const { x, y, z } = houses[houseId].position
          houses[houseId] = {
            ...houses[houseId],
            dna: columnLayoutToDNA([
              startColumn,
              ...midColumns,
              ...A.replicate(delta, {
                gridGroups: vanillaColumn,
              }),
              endColumn,
            ]),
            position: {
              x: x + dx / 2,
              y,
              z: z + dz / 2,
            },
          }
        } else if (sign(delta) === -1) {
        }
        break
      }
      case HandleSideEnum.Enum.FRONT: {
        if (sign(delta) === -1) {
          const { x, y, z } = houses[houseId].position
          houses[houseId] = {
            ...houses[houseId],
            dna: columnLayoutToDNA([
              startColumn,
              ...A.replicate(-delta, {
                gridGroups: vanillaColumn,
              }),
              ...midColumns,
              endColumn,
            ]),
            position: {
              x: x + dx / 2,
              y,
              z: z + dz / 2,
            },
          }
        } else if (sign(delta) === -1) {
        }
        break
      }
    }

    delete stretchLength[houseId]
  }
}

export const setTransients = () => {
  for (let houseId of Object.keys(postTransformsTransients)) {
    const { position, rotation } = postTransformsTransients[houseId] ?? {}
    if (position) {
      const { x, y, z } = houses[houseId].position
      const { dx, dy, dz } = position
      houses[houseId].position = {
        x: x + dx,
        y: y + dy,
        z: z + dz,
      }
    }
    if (rotation) {
      houses[houseId].rotation += rotation
    }
    delete postTransformsTransients[houseId]
    delete preTransformsTransients[houseId]
  }
}
