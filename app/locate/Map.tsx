import Map from "react-map-gl"
import "mapbox-gl/dist/mapbox-gl.css"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!

export default function MapView() {
  return (
    <Map
      id="mapbox-container"
      initialViewState={{
        longitude: -122.4,
        latitude: 37.8,
        zoom: 14,
      }}
      // style={{ width: 800, height: 600 }}
      // mapStyle="mapbox://styles/mapbox/streets-v9"
      mapStyle="mapbox://styles/mapbox/satellite-v9"
      mapboxAccessToken={MAPBOX_TOKEN}
    />
  )
}
