import houses from "@/hooks/houses"
import { useHousePreviews } from "@/hooks/previews"
import { R, S } from "@/utils/functions"
import { GroupProps } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import PreviewHouse from "./PreviewHouse"

type Props = GroupProps & {
  houseId: string
  setHouseVisible: (b: boolean) => void
}

const PreviewHouses = (props: Props) => {
  const { houseId, setHouseVisible } = props
  const systemId = houses[houseId].systemId
  const { dna: dnaPreviews } = useHousePreviews(houseId)

  return (
    <Fragment key={houseId}>
      {pipe(
        dnaPreviews,
        R.collect(S.Ord)((k, { value }) => {
          return (
            <PreviewHouse
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

export default PreviewHouses
