"use client"
import { Search } from "@carbon/icons-react"
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder"
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css"
import { Fragment, useEffect, useRef, useState } from "react"
import usePortal from "react-cool-portal"
import { useMap } from "react-map-gl"
import IconButton from "~/ui//IconButton"
import css from "./GeocoderControl.module.css"
import { dispatchLocateEvent, LocateEvents } from "../state/events"
import { useEvent } from "react-use"
import { useMapPolygon } from "../state/polygon"
import useFlyTo from "../hooks/useFlyTo"

type Props = {
  leftMenuContainerId: string
}

const GeocoderControl = (props: Props) => {
  const { leftMenuContainerId } = props
  const geocoderDiv = useRef<HTMLDivElement>(null)
  const { current: map } = useMap()

  const mapPolygon = useMapPolygon()

  const [geocoderEnabled, setGeocoderEnabled] = useState(() => {
    return mapPolygon === null
  })

  const hideGeocoder = () => {
    setGeocoderEnabled(false)
  }

  useEvent(LocateEvents.Enum.GeocoderEntered, hideGeocoder)
  useEvent(LocateEvents.Enum.GeocoderClickAway, hideGeocoder)

  const flyTo = useFlyTo()

  useEffect(() => {
    const container = geocoderDiv.current
    if (!container) return

    const geocoder = new MapboxGeocoder({
      marker: false,
      accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!,
      placeholder: "Enter a place name or address",
      // flyTo: true,
    })

    geocoder.addTo(container)

    geocoder.on("result", ({ result }) => {
      if (!map) return

      flyTo(result.center)

      dispatchLocateEvent(LocateEvents.Enum.GeocoderEntered)

      // setGeocoderEnabled(false)

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
  }, [map, geocoderEnabled, flyTo])

  const { Portal } = usePortal({
    containerId: leftMenuContainerId,
    autoRemoveContainer: false,
    internalShowHide: false,
  })

  return geocoderEnabled ? (
    <div className={css.root}>
      <div>
        <div className={css.above}>
          <h2>Where do you want to build?</h2>
        </div>
        <div ref={geocoderDiv} className={css.geocoder}></div>
        <div className={css.below}>
          <button
            onClick={() =>
              dispatchLocateEvent(LocateEvents.Enum.GeocoderClickAway)
            }
          >
            or find it on the map
          </button>
        </div>
      </div>
    </div>
  ) : (
    <Portal>
      <IconButton
        //  onClick={() => void setMode("SEARCH")}
        onClick={() => setGeocoderEnabled(true)}
      >
        <div className="flex items-center justify-center">
          <Search size={24} />
        </div>
      </IconButton>
    </Portal>
  )
}

export default GeocoderControl
