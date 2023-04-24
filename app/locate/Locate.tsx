"use client"
import React from "react"
import { MapProvider } from "react-map-gl"
import Controls from "./Controls"
import Map from "./Map"

const Locate = () => {
  return (
    <div className="relative w-full h-full">
      <MapProvider>
        <Map />
        <Controls />
      </MapProvider>
    </div>
  )
}

export default Locate
