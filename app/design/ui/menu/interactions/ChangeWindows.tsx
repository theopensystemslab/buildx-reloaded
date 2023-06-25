import { pipe } from "fp-ts/lib/function"
import { useEffect, useRef } from "react"
import { ref } from "valtio"
import houses from "~/design/state/houses"
import {
  useWindowOptions,
  WindowTypeOption,
} from "~/design/state/interactions/windows"
import { HouseModuleIdentifier } from "~/design/state/layouts"
import previews from "~/design/state/previews"
import { A } from "~/utils/functions"
import { Opening } from "~/ui/icons"
import Radio from "~/ui//Radio"
import ContextMenuNested from "../ContextMenuNested"

type Props = HouseModuleIdentifier & {
  onComplete?: () => void
}

const ChangeWindows = (props: Props) => {
  const { houseId, columnIndex, levelIndex, gridGroupIndex } = props

  const { options: windowTypeOptions, selected: selectedWindowOpt } =
    useWindowOptions({
      houseId,
      columnIndex,
      levelIndex,
      gridGroupIndex,
    })

  const windowTypeCount = windowTypeOptions.reduce(
    (acc, { value: { windowType } }) =>
      acc + Number(windowType.match(/[a-zA-Z]+|[0-9]+/g)?.[1]) ?? 0,
    0
  )

  const canChangeWindow = windowTypeOptions.length > 1 && windowTypeCount > 0

  const lastKey = useRef<string | null>(null)

  useEffect(() => {
    pipe(
      windowTypeOptions,
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
        windowTypeOptions,
        A.map(({ value: { houseDna } }) => {
          const key = houseDna.toString()
          delete previews[houseId].dnas[key]
        })
      )
      lastKey.current = null
    }
  }, [houseId, windowTypeOptions])

  const previewWindowType = (incoming: WindowTypeOption["value"] | null) => {
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

  const changeWindow = ({ houseDna }: WindowTypeOption["value"]) => {
    houses[houseId].dnas = houseDna
    props.onComplete?.()
  }

  return canChangeWindow ? (
    <ContextMenuNested icon={<Opening />} label={`Change windows`} unpaddedSvg>
      <Radio
        options={windowTypeOptions}
        selected={selectedWindowOpt}
        onChange={changeWindow}
        onHoverChange={previewWindowType}
      />
    </ContextMenuNested>
  ) : null
}

export default ChangeWindows
