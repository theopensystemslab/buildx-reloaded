import { FlyToOptions } from "mapbox-gl"
import { useMap } from "react-map-gl"

export const flyToDefaultOpts: Partial<FlyToOptions> = {
  zoom: 19,
  duration: 3000,
}

const useFlyTo = () => {
  const { current: map } = useMap()

  return (
    [lng, lat]: [number, number],
    flyToExtraOpts: Partial<FlyToOptions> = {}
  ) => {
    map?.flyTo({
      center: [lng, lat],
      ...flyToDefaultOpts,
      ...flyToExtraOpts,
    })
  }
}

export default useFlyTo
