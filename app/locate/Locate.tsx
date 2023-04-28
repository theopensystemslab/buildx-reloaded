"use client"
import PolygonControl from "./PolygonControl"
import Map from "./Map"
import GeocoderControl from "./GeocoderControl"
import css from "./Locate.module.css"
import { useState } from "react"
import { useLocateState } from "./state"

// state = Geocoding | DrawingPolygon | PolygonDrawn

const Locate = () => {
  const locateState = useLocateState()

  return (
    <div className={css.root}>
      <Map>
        <PolygonControl />
        <GeocoderControl />
      </Map>
      {locateState === "DRAWING_POLYGON" && (
        <div className={css.instructDrawTopLeft}>
          <h2>Draw the outline of your site</h2>
        </div>
      )}
    </div>
  )
}

export default Locate
