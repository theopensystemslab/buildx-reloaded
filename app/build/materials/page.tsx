"use client"

import { trpc } from "../../../client/trpc"

const MaterialsIndex = () => {
  const { data: modules } = trpc.modules.useQuery()
  const { data: houseTypes } = trpc.houseTypes.useQuery()

  return (
    <div>
      <h1>materials</h1>
      <pre>{JSON.stringify(houseTypes, null, 2)}</pre>
    </div>
  )
}

export default MaterialsIndex
