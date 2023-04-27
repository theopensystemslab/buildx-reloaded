import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder"
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css"
import { useEffect, useRef } from "react"
import { useMap } from "react-map-gl"
import css from "./GeocoderControl.module.css"

const MAX_ZOOM = 19

const GeocoderControl = () => {
  const geocoderDiv = useRef<HTMLDivElement>(null)

  // const geocoder = useControl<MapboxGeocoder>(
  //   () => {
  //     const ctrl = new MapboxGeocoder({
  //       marker: false,
  //       accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!,
  //       placeholder: "Enter a place name or address",
  //     })
  //     ctrl.on("result", (evt) => {})

  //     return ctrl
  //   },
  //   { position: "top-left" }
  // )

  const { current: map } = useMap()

  useEffect(() => {
    const container = geocoderDiv.current
    if (!container) return

    const geocoder = new MapboxGeocoder({
      marker: false,
      accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!,
      placeholder: "Enter a place name or address",
      flyTo: true,
      // mapboxgl: mapboxgl as any,
    })

    geocoder.addTo(container)

    geocoder.on("result", ({ result }) => {
      if (!map) return
      // const target = fromLonLat(result.center) as [number, number]

      map.flyTo({ center: result.center })
      map.zoomTo(MAX_ZOOM)

      console.log("hi")
      // map.getView().setCenter(target)
      // map.getView().setZoom(maxZoom)

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

  return (
    <div className={css.root}>
      <div>
        <div className={css.above}>
          <h2>Enter your project location to begin</h2>
        </div>
        <div ref={geocoderDiv} className={css.geocoder}></div>
        <div className={css.below}>{`I'm below`}</div>
      </div>
    </div>
  )
}

export default GeocoderControl
