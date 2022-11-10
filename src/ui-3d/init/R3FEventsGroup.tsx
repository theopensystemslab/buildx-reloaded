import { GroupProps, ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { PropsWithChildren, useEffect } from "react"
import { subscribe } from "valtio"
import { subscribeKey } from "valtio/utils"
import events from "../../hooks/events"

const R3FEventsGroup = (props: PropsWithChildren<GroupProps>) => {
  const bind: any = useGesture<{ hover: ThreeEvent<PointerEvent> }>({
    onHover: ({
      event: {
        object: {
          userData: {
            systemId,
            houseId,
            columnIndex,
            levelIndex,
            gridGroupIndex,
            elementName,
          },
        },
      },
    }) => {
      events.hover = {
        systemId,
        houseId,
        columnIndex,
        levelIndex,
        gridGroupIndex,
        elementName,
      }
    },
  })

  useEffect(() => {
    return subscribeKey(events, "hover", () => {
      console.log(events.hover)
    })
  })
  return <group {...props} {...bind()} />
}

export default R3FEventsGroup
