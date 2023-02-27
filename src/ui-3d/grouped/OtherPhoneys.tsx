import { GroupProps } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import houses from "../../hooks/houses"
import { useHousePreviews } from "../../hooks/previews"
import { useSiteCtx } from "../../hooks/siteCtx"
import { R, S } from "../../utils/functions"
import PhonyDnaHouse2 from "./stretchWidth/PhonyDnaHouse2"

type Props = GroupProps & {
  houseId: string
  setHouseVisible: (b: boolean) => void
}

const OtherPhoneys = (props: Props) => {
  const { houseId, setHouseVisible } = props
  const { houseId: siteCtxHouseId } = useSiteCtx()
  const systemId = houses[houseId].systemId
  const { dna: dnaPreviews } = useHousePreviews(houseId)

  return (
    <Fragment key={houseId}>
      {houseId !== siteCtxHouseId
        ? null
        : pipe(
            dnaPreviews,
            R.collect(S.Ord)((k, { value }) => {
              return (
                <PhonyDnaHouse2
                  key={`${houseId}:${k}`}
                  houseId={houseId}
                  systemId={systemId}
                  dna={value}
                  setHouseVisible={setHouseVisible}
                />
              )
            })
          )}
    </Fragment>
  )
}

export default OtherPhoneys
