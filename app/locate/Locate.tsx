"use client"
import PolygonControl from "./PolygonControl"
import Map from "./Map"
import GeocoderControl from "./GeocoderControl"
import css from "./Locate.module.css"
import { useState } from "react"

// state = Geocoding | DrawingPolygon | PolygonDrawn

const Locate = () => {
  const [drawing, setDrawing] = useState(true)
  const [geocoding, setGeocoding] = useState(true)

  return (
    <div className={css.root}>
      <Map>
        <PolygonControl />
        <GeocoderControl />
      </Map>
      {drawing && (
        <div className={css.instructDrawTopLeft}>
          <h2>Draw the outline of your site</h2>
        </div>
      )}
    </div>
  )
}

export default Locate
