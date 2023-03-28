"use client"

import { trpc } from "../../../client/trpc"

const MaterialsIndex = () => {
  const { data: modules } = trpc.modules.useQuery()
  const { data: houseTypes } = trpc.houseTypes.useQuery()
  const { data: elements } = trpc.elements.useQuery()
  const { data: materials } = trpc.materials.useQuery()

  return (
    <div>
      <h1>materials</h1>
      <pre>
        {JSON.stringify(
          {
            elements,
            materials,
          },
          null,
          2
        )}
      </pre>
    </div>
  )
}

export default MaterialsIndex
