import React from "react"
import houses from "../../hooks/houses"
import { LevelTypeOption, useChangeLevelType } from "../../hooks/levels"
import Radio from "../Radio"
import ContextMenuNested from "./ContextMenuNested"

type Props = {
  houseId: string
}

const ChangeLevelType = (props: Props) => {
  const { houseId } = props
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
  }

  return canChangeLevelType ? (
    <ContextMenuNested long label={`Change ${levelString} type`}>
      <Radio
        options={levelTypeOptions}
        selected={selectedLevelType}
        onChange={changeLevelType}
      />
    </ContextMenuNested>
  ) : null
}

export default ChangeLevelType
