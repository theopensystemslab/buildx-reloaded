import {
  LevelTypeOption,
  useChangeLevelType,
} from "~/design/state/interactions/levels"
import previews from "~/design/state/previews"
import { A } from "~/utils/functions"
import { pipe } from "fp-ts/lib/function"
import { useEffect, useRef } from "react"
import { ref } from "valtio"
import houses from "~/design/state/houses"
import Radio from "~/ui//Radio"
import { ChangeLevel } from "~/ui/icons"
import ContextMenuNested from "../ContextMenuNested"

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
    houses[houseId].dnas = houseDna
    onChange?.()
  }

  const lastKey = useRef<string | null>(null)

  useEffect(() => {
    pipe(
      levelTypeOptions,
      A.map(({ value: { houseDna } }) => {
        const key = houseDna.toString()
        previews[houseId].dnas[key] = {
          active: false,
          value: ref(houseDna),
        }
      })
    )

    return () => {
      pipe(
        levelTypeOptions,
        A.map(({ value: { houseDna } }) => {
          const key = houseDna.toString()
          delete previews[houseId].dnas[key]
        })
      )
      lastKey.current = null
    }
  }, [houseId, levelTypeOptions])

  const previewLevelType = (incoming: LevelTypeOption["value"] | null) => {
    if (incoming === null) {
      if (
        lastKey.current !== null &&
        lastKey.current in previews[houseId].dnas
      ) {
        previews[houseId].dnas[lastKey.current].active = false
        lastKey.current = null
      }
    } else {
      const { houseDna } = incoming
      const key = houseDna.toString()
      lastKey.current = key
      previews[houseId].dnas[key].active = true
    }
  }

  return canChangeLevelType ? (
    <ContextMenuNested
      long
      label={`Change ${levelString} type`}
      icon={<ChangeLevel />}
      unpaddedSvg
    >
      <Radio
        options={levelTypeOptions}
        selected={selectedLevelType}
        onChange={changeLevelType}
        onHoverChange={previewLevelType}
      />
    </ContextMenuNested>
  ) : null
}

export default ChangeLevelType
