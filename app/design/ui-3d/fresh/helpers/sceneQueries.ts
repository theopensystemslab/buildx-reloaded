import { pipe } from "fp-ts/lib/function"
import { RefObject } from "react"
import { Group } from "three"
import { A, O } from "../../../../utils/functions"

export const rootHouseGroupQuery = (
  rootRef: RefObject<Group>,
  houseId: string
) =>
  pipe(
    rootRef.current?.children,
    O.fromNullable,
    O.chain(A.findFirst((x) => x.userData.houseId === houseId))
  )
