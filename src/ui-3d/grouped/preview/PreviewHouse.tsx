import { useDnaColumnLayout } from "@/hooks/layouts"
import { A } from "@/utils/functions"
import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { useRef } from "react"
import { Group } from "three"
import previews from "@/hooks/previews"
import { useSubscribeKey } from "@/utils/hooks"
import PreviewColumn from "./PreviewColumn"

type Props = {
  houseId: string
  systemId: string
  dna: string[]
  setHouseVisible: (b: boolean) => void
}

const PreviewHouse = (props: Props) => {
  const ref = useRef<Group>(null)

  const { houseId, systemId, dna, setHouseVisible, ...restProps } = props

  const layout = useDnaColumnLayout(systemId, dna)

  const key = dna.toString()

  useSubscribeKey(
    previews[houseId].dna,
    key,
    () => {
      const { active } = previews[houseId].dna?.[key] ?? { active: false }
      const v = active ? 1 : 0
      ref.current?.scale.set(v, v, v)
      setHouseVisible(!active)
      invalidate()
    },
    true
  )

  return (
    <group
      name={`phonyHouse:${houseId}:${dna}`}
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
