import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder"
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css"
import { Fragment } from "react"
import { useControl } from "react-map-gl"
import css from "./GeocoderControl.module.css"

const GeocoderControl = () => {
  const geocoder = useControl<MapboxGeocoder>(
    () => {
      const ctrl = new MapboxGeocoder({
        marker: false,
        accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!,
        placeholder: "Enter a place name or address",
      })
      ctrl.on("result", (evt) => {})

      return ctrl
    },
    { position: "top-left" }
  )

  return (
    <div className={css.root}>
      <div className={css.above}>{`I'm above`}</div>
      <div className={css.middle}></div>
      <div className={css.below}>{`I'm below`}</div>
    </div>
  )
}

export default GeocoderControl
