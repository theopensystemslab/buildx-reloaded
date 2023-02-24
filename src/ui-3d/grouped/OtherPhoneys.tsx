import { GroupProps } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { Fragment, useState } from "react"
import houses from "../../hooks/houses"
import previews from "../../hooks/previews"
import { R, S } from "../../utils/functions"
import { useSubscribeKey } from "../../utils/hooks"
import PhonyDnaHouse2 from "./stretchWidth/PhonyDnaHouse2"

type Props = GroupProps & {
  houseId: string
  setHouseVisible: (b: boolean) => void
}

const OtherPhoneys = (props: Props) => {
  const { houseId, setHouseVisible, ...groupProps } = props

  const systemId = houses[houseId].systemId

  const [children, setChildren] = useState<JSX.Element[]>([])

  useSubscribeKey(previews[houseId], "dna", () => {
    setChildren(
      pipe(
        previews[houseId].dna,
        R.collect(S.Ord)((k, { value }) => {
          return (
            <PhonyDnaHouse2
              key={k}
              houseId={houseId}
              systemId={systemId}
              dna={value}
              setHouseVisible={setHouseVisible}
            />
          )
        })
      )
    )
  })

  return <Fragment>{children}</Fragment>
}

export default OtherPhoneys
