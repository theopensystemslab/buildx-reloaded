"use client"
import PolygonControl from "./PolygonControl"
import Map from "./Map"
import GeocoderControl from "./GeocoderControl"
import css from "./Locate.module.css"

const Locate = () => {
  return (
    <div className={css.root}>
      <Map>
        <PolygonControl />
        <GeocoderControl />
      </Map>
    </div>
  )
}

export default Locate
