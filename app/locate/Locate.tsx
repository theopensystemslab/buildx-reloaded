"use client"
import React from "react"
import { MapProvider } from "react-map-gl"
import DrawControls from "./DrawControls"
import Map from "./Map"

const Locate = () => {
  return (
    <div className="relative w-full h-full">
      <Map>
        <DrawControls />
      </Map>
    </div>
  )
}

export default Locate
