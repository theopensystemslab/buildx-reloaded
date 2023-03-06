import React, { Fragment } from "react"
import houses from "@//hooks/houses"
import {
  StairsOpt,
  useLayoutOptions,
  useStairsOptions,
} from "@//hooks/interactions/layouts"
import { HouseModuleIdentifier } from "@//hooks/layouts"
import { Menu } from "@/ui/icons"
import Radio from "@/ui/Radio"
import ContextMenuNested from "../common/ContextMenuNested"

type Props = HouseModuleIdentifier & {
  onComplete?: () => void
}

const ChangeLayouts = (props: Props) => {
  const { houseId, columnIndex, levelIndex, gridGroupIndex, onComplete } = props

  const { options: layoutOpts, selected: selectedLayoutOpt } = useLayoutOptions(
    {
      houseId,
      columnIndex,
      gridGroupIndex,
      levelIndex,
    }
  )

  const canChangeLayout = layoutOpts.length > 1

  const changeLayout = ({ houseDna }: typeof layoutOpts[0]["value"]) => {
    houses[houseId].dna = houseDna
    props.onComplete?.()
  }

  const { options: stairsOpts, selected: selectedStairsOpt } = useStairsOptions(
    {
      houseId,
      columnIndex,
      levelIndex,
      gridGroupIndex,
    }
  )

  const canChangeStairs = stairsOpts.length > 1

  const changeStairs = ({ houseDna }: StairsOpt["value"]) => {
    houses[houseId].dna = houseDna
    props.onComplete?.()
  }

  return (
    <Fragment>
      {canChangeLayout && (
        <ContextMenuNested label="Change layout" icon={<Menu />}>
          <Radio
            options={layoutOpts}
            selected={selectedLayoutOpt}
            onChange={changeLayout}
          />
        </ContextMenuNested>
      )}
      {canChangeStairs && (
        <ContextMenuNested label="Change stairs" icon={<Menu />}>
          <Radio
            options={stairsOpts}
            selected={selectedStairsOpt}
            onChange={changeStairs}
            compare={(a, b) => a.stairType === b.stairType}
          />
        </ContextMenuNested>
      )}
    </Fragment>
  )
}

export default ChangeLayouts
