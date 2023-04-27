import ReactMapGLMap from "react-map-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { PropsWithChildren } from "react"

const Map = ({ children }: PropsWithChildren<{}>) => {
  return (
    <ReactMapGLMap
      initialViewState={{
        longitude: -122.4,
        latitude: 37.8,
        zoom: 14,
      }}
      // style={{ width: 800, height: 600 }}
      // mapStyle="mapbox://styles/mapbox/streets-v9"
      mapStyle="mapbox://styles/mapbox/satellite-v9"
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!}
      // reuseMaps
    >
      {children}
    </ReactMapGLMap>
  )
}

export default Map
