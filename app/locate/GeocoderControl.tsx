import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder"
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useMap } from "react-map-gl"
import css from "./GeocoderControl.module.css"

const MAX_ZOOM = 19

const GeocoderControl = () => {
  const geocoderDiv = useRef<HTMLDivElement>(null)

  const [geocoderEnabled, setGeocoderEnabled] = useState(true)

  const { current: map } = useMap()

  useEffect(() => {
    const container = geocoderDiv.current
    if (!container) return

    const geocoder = new MapboxGeocoder({
      marker: false,
      accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!,
      placeholder: "Enter a place name or address",
      flyTo: true,
    })

    geocoder.addTo(container)

    geocoder.on("result", ({ result }) => {
      if (!map) return

      console.log(result.center)

      map.flyTo({ center: result.center, zoom: MAX_ZOOM })

      setGeocoderEnabled(false)

      // const isGB = result.context.find(
      //   ({ id, short_code }: any) =>
      //     id.includes("country") && short_code === "gb"
      // )

      // if (isGB && siteContext.region !== "UK") siteContext.region = "UK"

      // else if (siteContext.region !== "EU") siteContext.region = "EU"

      // setMode("DRAW")
    })

    return () => {
      container.replaceChildren()
    }
  }, [map])

  const hideGeocoder = () => {
    setGeocoderEnabled(false)
  }

  return !geocoderEnabled ? null : (
    <div className={css.root}>
      <div>
        <div className={css.above}>
          <h2>Enter your project location to begin</h2>
        </div>
        <div ref={geocoderDiv} className={css.geocoder}></div>
        <div className={css.below}>
          <button onClick={hideGeocoder}>or find it on the map</button>
        </div>
      </div>
    </div>
  )
}

export default GeocoderControl
