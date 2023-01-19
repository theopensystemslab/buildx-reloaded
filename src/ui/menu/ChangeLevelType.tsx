import houses from "../../hooks/houses"
import { LevelTypeOption, useChangeLevelType } from "../../hooks/levels"
import { Menu } from "../icons"
import Radio from "../Radio"
import ContextMenuNested from "./ContextMenuNested"

type Props = {
  houseId: string
  onChange?: () => void
}

const ChangeLevelType = (props: Props) => {
  const { houseId, onChange } = props
  const { systemId } = houses[houseId]

  const {
    options: levelTypeOptions,
    selected: selectedLevelType,
    levelString,
  } = useChangeLevelType({
    systemId,
  })

  const canChangeLevelType = levelTypeOptions.length > 1

  const changeLevelType = ({ houseDna }: LevelTypeOption["value"]) => {
    houses[houseId].dna = houseDna
    onChange?.()
  }

  return canChangeLevelType ? (
    <ContextMenuNested
      long
      label={`Change ${levelString} type`}
      icon={<Menu />}
    >
      <Radio
        options={levelTypeOptions}
        selected={selectedLevelType}
        onChange={changeLevelType}
      />
    </ContextMenuNested>
  ) : null
}

export default ChangeLevelType
