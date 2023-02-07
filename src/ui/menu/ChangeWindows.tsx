import React from "react"
import houses from "../../hooks/houses"
import { useWindowOptions, WindowOpt } from "../../hooks/interactions/windows"
import { HouseModuleIdentifier } from "../../hooks/layouts"
import scope from "../../hooks/scope"
import { Opening } from "../icons"
import Radio from "../Radio"
import ContextMenuHeading from "./ContextMenuHeading"
import ContextMenuNested from "./ContextMenuNested"

type Props = HouseModuleIdentifier & {
  onClose?: () => void
}

const ChangeWindows = (props: Props) => {
  const { houseId, columnIndex, levelIndex, gridGroupIndex } = props

  const { options: windowOpts, selected: selectedWindowOpt } = useWindowOptions(
    {
      houseId,
      columnIndex,
      levelIndex,
      gridGroupIndex,
    }
  )

  const windowTypeCount = windowOpts.reduce(
    (acc, { value: { windowType } }) =>
      acc + Number(windowType.match(/[a-zA-Z]+|[0-9]+/g)?.[1]) ?? 0,
    0
  )

  const canChangeWindow = windowOpts.length > 1 && windowTypeCount > 0

  const changeWindow = ({ buildingDna }: WindowOpt["value"]) => {
    houses[houseId].dna = buildingDna
    props.onClose?.()
  }

  return (
    <ContextMenuNested icon={<Opening />} label={`Change windows`} unpaddedSvg>
      Hi
      <Radio
        options={windowOpts}
        selected={selectedWindowOpt}
        onChange={changeWindow}
      />
      {/* <ContextMenuHeading>{elementName}</ContextMenuHeading>
      <Radio
        options={options}
        selected={
          house.modifiedMaterials?.[element.name] ?? element.defaultMaterial
        }
        onChange={(newMaterial) => {
          houses[houseId].modifiedMaterials = {
            ...(house.modifiedMaterials ?? {}),
            [element.name]: newMaterial,
          }
          onComplete?.()
        }}
      /> */}
    </ContextMenuNested>
  )
}

export default ChangeWindows
