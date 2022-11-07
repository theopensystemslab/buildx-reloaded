import { Instance } from "@react-three/drei"
import React, { useEffect, useRef } from "react"
import { subscribeKey } from "valtio/utils"
import houses from "../../hooks/houses"
import { InstanceData } from "../../hooks/instances"

const SystemModuleElementInstance = (props: InstanceData) => {
  const ref = useRef<any>()
  const {
    systemId,
    houseId,
    columnIndex,
    levelIndex,
    gridGroupIndex,
    dna,
    elementName,
    position,
    rotation,
  } = props

  useEffect(() => {
    const go = () => {
      const [hx, hy, hz] = houses[houseId].position
      const [px, py, pz] = position
      ref.current.position.set(hx + px, hy + py, hz + pz)
    }
    go()
    return subscribeKey(houses[houseId], "position", go)
  }, [houseId, position])

  return (
    <Instance
      ref={ref}
      key={JSON.stringify({
        systemId,
        houseId,
        columnIndex,
        levelIndex,
        gridGroupIndex,
        dna,
        elementName,
      })}
      position={position}
      rotation={[0, rotation, 0]}
      userData={{
        systemId,
        houseId,
        columnIndex,
        levelIndex,
        gridGroupIndex,
        dna,
        elementName,
      }}
    />
  )
}

export default SystemModuleElementInstance
