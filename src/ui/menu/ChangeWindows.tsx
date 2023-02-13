import houses from "../../hooks/houses"
import { useWindowOptions, WindowOpt } from "../../hooks/interactions/windows"
import { HouseModuleIdentifier } from "../../hooks/layouts"
import { Opening } from "../icons"
import Radio from "../Radio"
import ContextMenuNested from "./ContextMenuNested"

type Props = HouseModuleIdentifier & {
  onComplete?: () => void
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

  const changeWindow = ({ houseDna }: WindowOpt["value"]) => {
    houses[houseId].dna = houseDna
    props.onComplete?.()
  }

  return canChangeWindow ? (
    <ContextMenuNested icon={<Opening />} label={`Change windows`} unpaddedSvg>
      <Radio
        options={windowOpts}
        selected={selectedWindowOpt}
        onChange={changeWindow}
      />
    </ContextMenuNested>
  ) : null
}

export default ChangeWindows
