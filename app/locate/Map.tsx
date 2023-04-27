import "mapbox-gl/dist/mapbox-gl.css"
import { PropsWithChildren } from "react"
import ReactMapGLMap from "react-map-gl"

const gadheim = {
  longitude: 9.902056,
  latitude: 49.843,
}

const Map = ({ children }: PropsWithChildren<{}>) => {
  return (
    <ReactMapGLMap
      initialViewState={{
        ...gadheim,
        zoom: 3,
      }}
      mapStyle="mapbox://styles/mapbox/satellite-v9"
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!}
      reuseMaps
    >
      {children}
    </ReactMapGLMap>
  )
}

export default Map
