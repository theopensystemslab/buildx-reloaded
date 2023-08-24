import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { useRef } from "react"
import { Group } from "three"
import { useDnasLayout } from "~/design/state/layouts"
import previews from "~/design/state/previews"
import { A } from "~/utils/functions"
import { useSubscribeKey } from "~/utils/hooks"
import PreviewColumn from "./PreviewColumn"

type Props = {
  houseId: string
  systemId: string
  dnas: string[]
  setHouseVisible: (b: boolean) => void
}

const PreviewHouse = (props: Props) => {
  const ref = useRef<Group>(null)

  const { houseId, systemId, dnas, setHouseVisible, ...restProps } = props

  const layout = useDnasLayout({ systemId, dnas })

  const key = dnas.toString()

  useSubscribeKey(
    previews[houseId].dnas,
    key,
    () => {
      const { active } = previews[houseId].dnas?.[key] ?? { active: false }
      const v = active ? 1 : 0
      ref.current?.scale.set(v, v, v)
      setHouseVisible(!active)
      invalidate()
    },
    true
  )

  return (
    <group
      name={`phonyHouse:${houseId}:${key}`}
      ref={ref}
      scale={[0, 0, 0]}
      {...restProps}
    >
      {pipe(
        layout,
        A.map((column) => (
          <PreviewColumn
            key={`phony:${houseId}:${column.columnIndex}`}
            {...{ systemId, houseId, column }}
          />
        ))
      )}
    </group>
  )
}

export default PreviewHouse
