import { Search } from "@carbon/icons-react"
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder"
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css"
import { Fragment, useEffect, useRef, useState } from "react"
import usePortal from "react-cool-portal"
import { useMap } from "react-map-gl"
import IconButton from "@/ui/common/IconButton"
import css from "./GeocoderControl.module.css"
import { dispatchLocateEvent, LocateEvents } from "../state/events"
import { useEvent } from "react-use"
import { useMapPolygon } from "../state/polygon"

const MAX_ZOOM = 19

type Props = {
  leftMenuContainerId: string
}

const GeocoderControl = (props: Props) => {
  const { leftMenuContainerId } = props
  const geocoderDiv = useRef<HTMLDivElement>(null)
  const { current: map } = useMap()

  const mapPolygon = useMapPolygon()

  const [geocoderEnabled, setGeocoderEnabled] = useState(() => {
    console.log(mapPolygon)
    return mapPolygon === null
  })

  const hideGeocoder = () => {
    setGeocoderEnabled(false)
  }

  useEvent(LocateEvents.Enum.GeocoderEntered, hideGeocoder)
  useEvent(LocateEvents.Enum.GeocoderClickAway, hideGeocoder)

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

      map.flyTo({ center: result.center, zoom: MAX_ZOOM })

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
  }, [map, geocoderEnabled])

  const { Portal } = usePortal({
    containerId: leftMenuContainerId,
    autoRemoveContainer: false,
    internalShowHide: false,
  })

  return geocoderEnabled ? (
    <div className={css.root}>
      <div>
        <div className={css.above}>
          <h2>Enter your project location to begin</h2>
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
