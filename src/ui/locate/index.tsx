import { BUILDX_LOCAL_STORAGE_MAP_POLYGON_KEY } from "@/constants"
import siteCtx, { useLocallyStoredSiteCtx } from "@/hooks/siteCtx"
import mapProxy, {
  getMapPolygonCentre,
  useMapMode,
  useMapPolygon,
  useMapUpdater,
} from "@/hooks/map"
import { ArrowRight, Search, TrashCan } from "@carbon/icons-react"
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder"
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css"
import { Snackbar } from "@mui/material"
import { toWgs84 } from "@turf/turf"
import clsx from "clsx"
import { pipe } from "fp-ts/lib/function"
import { Feature, Polygon } from "geojson"
import mapboxgl from "mapbox-gl"
import Link from "next/link"
import { Feature as OLFeature, Map, View } from "ol"
import { FeatureLike } from "ol/Feature"
import GeoJSON from "ol/format/GeoJSON"
import { Circle, LineString, MultiPoint, Point } from "ol/geom"
import OLPolygon from "ol/geom/Polygon"
import { Draw, Modify, Snap } from "ol/interaction"
import TileLayer from "ol/layer/Tile"
import VectorLayer from "ol/layer/Vector"
import "ol/ol.css"
import { fromLonLat } from "ol/proj"
import VectorSource from "ol/source/Vector"
import XYZ from "ol/source/XYZ"
import { getLength } from "ol/sphere"
import { Circle as StyleCircle, Fill, Stroke, Style, Text } from "ol/style"
import RegularShape from "ol/style/RegularShape"
import { useEffect, useRef, useState } from "react"
import IconButton from "../IconButton"
import { Menu } from "@/ui/icons"
import UniversalMenu from "@/ui/UniversalMenu"
import { useEscape } from "@/ui/utils"
import css from "./index.module.css"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!

// const almere = fromLonLat([5.2647, 52.3508]) as [number, number]
// const westerngrund = fromLonLat([9.1515, 50.68]) as [number, number]

const gadheim = fromLonLat([9.902056, 49.843]) as [number, number]

const formatLength = function (line: LineString) {
  const length = getLength(line)
  let output
  if (length > 100) {
    output = Math.round((length / 1000) * 100) / 100 + " km"
  } else {
    output = Math.round(length * 100) / 100 + " m"
  }
  return output
}

const LocateIndex = () => {
  const [universalMenu, setUniversalMenu] = useState(false)

  const geocoderDiv = useRef<HTMLDivElement>(null)
  const mapDiv = useRef<HTMLDivElement>(null)

  const maxZoom = 19

  const [mode, setMode] = useMapMode()

  const [mapPolygon] = useMapPolygon()

  const [vectorSource] = useState(new VectorSource())

  const [xyzSource] = useState(
    new XYZ({
      url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      maxZoom,
    })
  )

  const [modify] = useState(new Modify({ source: vectorSource }))

  const [snap] = useState(new Snap({ source: vectorSource }))

  const [tileLayer] = useState(
    new TileLayer({
      source: xyzSource,
    })
  )
  const vectorStyle = new Style({
    fill: new Fill({
      color: "rgba(255, 255, 255, 0.2)",
    }),
    stroke: new Stroke({
      color: "#fff",
      width: 2,
    }),
  })

  const verticesStyle = new Style({
    image: new StyleCircle({
      radius: 5,
      fill: new Fill({
        color: "white",
      }),
    }),
    geometry: (feature) => {
      const zeroGeom = new Circle([0, 0], 0)
      const featureGeom = feature.getGeometry()
      if (!featureGeom) return zeroGeom

      const type = featureGeom.getType()

      switch (type) {
        case "Polygon":
          return new MultiPoint((featureGeom as OLPolygon).getCoordinates()[0])
        default:
          return zeroGeom
      }
    },
  })

  const styleFunction = (feature: FeatureLike) => {
    const styles: Style[] = [vectorStyle, verticesStyle]

    const type = feature.getGeometry()?.getType()

    if (type === "Polygon") {
      const poly = feature.getGeometry() as OLPolygon
      // const area = poly.getArea()
      const coords = poly.getCoordinates()
      const line = new LineString(coords[0])
      let count = 0

      line.forEachSegment(function (a, b) {
        const segment = new LineString([a, b])
        const label = formatLength(segment)
        if (segmentStyles.length - 1 < count) {
          segmentStyles.push(segmentStyle.clone())
        }
        const segmentPoint = new Point(segment.getCoordinateAt(0.5))
        segmentStyles[count].setGeometry(segmentPoint)
        segmentStyles[count].getText().setText(label)
        styles.push(segmentStyles[count])
        count++
      })
    }

    return styles
  }

  const [draw] = useState(
    new Draw({
      source: vectorSource,
      type: "Polygon",
      style: styleFunction,
    })
  )

  const segmentStyle = new Style({
    text: new Text({
      font: "12px Calibri,sans-serif",
      fill: new Fill({
        color: "rgba(255, 255, 255, 1)",
      }),
      backgroundFill: new Fill({
        color: "rgba(0, 0, 0, 0.4)",
      }),
      padding: [2, 2, 2, 2],
      textBaseline: "bottom",
      offsetY: -12,
    }),
    image: new RegularShape({
      radius: 6,
      points: 3,
      angle: Math.PI,
      displacement: [0, 8],
      fill: new Fill({
        color: "rgba(0, 0, 0, 0.4)",
      }),
    }),
  })

  const segmentStyles = [segmentStyle]

  const [map] = useState(
    new Map({
      layers: [
        tileLayer,
        new VectorLayer({
          source: vectorSource,
          style: styleFunction,
        }),
      ],
      view: new View({
        center: gadheim,
        zoom: 5,
        maxZoom,
      }),
      controls: [],
    })
  )

  useLocallyStoredSiteCtx()

  useEffect(() => {
    draw.on("drawstart", (event) => {
      mapProxy.polygon = null
      vectorSource.clear()
    })

    draw.on("drawend", ({ feature }) => {
      const polyFeature = JSON.parse(
        new GeoJSON().writeFeature(feature)
      ) as Feature<Polygon>

      mapProxy.polygon = {
        coordinates: polyFeature.geometry.coordinates,
        type: polyFeature.geometry.type,
      }

      pipe(
        mapProxy.polygon,
        getMapPolygonCentre,
        toWgs84,
        setProjectNameFromLongLat
      )
    })
  }, [draw, vectorSource])

  useMapUpdater()

  useEffect(() => {
    if (!mapDiv.current) return
    map.setTarget(mapDiv.current)
    return () => {
      map.setTarget(undefined)
    }
  }, [map])

  const setProjectNameFromLongLat = async ([lat, lon]: [number, number]) => {
    const result = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lat},${lon}.json?types=place%2Cpostcode%2Caddress&limit=1&access_token=${mapboxgl.accessToken}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    ).then((response) => response.json())

    siteCtx.projectName = result?.features?.[0]?.text ?? "New Project"
  }

  useEffect(() => {
    if (!geocoderDiv.current) return

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl as any,
      flyTo: true,
      marker: false,
      placeholder: "Enter the location of your site",
    })

    geocoder.addTo(geocoderDiv.current!)

    geocoder.on("result", ({ result }) => {
      const target = fromLonLat(result.center) as [number, number]
      map.getView().setCenter(target)
      map.getView().setZoom(maxZoom)

      const isGB = result.context.find(
        ({ id, short_code }: any) =>
          id.includes("country") && short_code === "gb"
      )
      if (isGB && siteCtx.region !== "UK") siteCtx.region = "UK"
      else if (siteCtx.region !== "EU") siteCtx.region = "EU"

      setMode("DRAW")
    })

    return () => {
      if (!geocoderDiv.current) return
      geocoderDiv.current.replaceChildren()
    }
  }, [map, setMode])

  useEffect(() => {
    if (mode === "DRAW") {
      map.addInteraction(modify)
      map.addInteraction(draw)
      map.addInteraction(snap)
    } else {
      map.removeInteraction(modify)
      map.removeInteraction(draw)
      map.removeInteraction(snap)
    }
  }, [draw, map, mode, modify, snap])

  const [snack, setSnack] = useState(false)

  useEffect(() => {
    if (mode === "DRAW" && !mapPolygon) {
      setSnack(true)
    } else if (mapPolygon) {
      vectorSource.clear()
      vectorSource.addFeature(
        new OLFeature({
          geometry: new OLPolygon(mapPolygon.coordinates),
        })
      )
      map.getView().setCenter(getMapPolygonCentre(mapPolygon))
      map.getView().setZoom(maxZoom)
    } else {
      setSnack(false)
    }
  }, [map, mapPolygon, mode, vectorSource])

  useEffect(() => {
    if (mapPolygon !== null && mode === "SEARCH") setMode("DRAW")
  }, [mapPolygon, mode, setMode])

  const rootRef = useRef<HTMLDivElement>(null)

  const discardSearch = () => {
    if (mode === "SEARCH" && mapPolygon !== null) {
      setMode("DRAW")
    }
  }

  useEscape(discardSearch)

  return (
    <div
      ref={rootRef}
      className="relative flex h-full w-full flex-col items-center justify-center"
      onClick={discardSearch}
    >
      <div className="absolute top-0 right-0 z-10 flex items-center justify-center text-white">
        <IconButton onClick={() => setUniversalMenu(true)}>
          <Menu />
        </IconButton>
      </div>
      <UniversalMenu
        open={universalMenu}
        close={() => setUniversalMenu(false)}
      />
      <div ref={mapDiv} className="w-full h-full" />
      <div
        ref={geocoderDiv}
        className={clsx(css.geocoder, mode === "DRAW" && "hidden")}
      />
      {mode === "DRAW" && (
        <div className="absolute left-0 flex flex-col items-center justify-center bg-white">
          <IconButton onClick={() => void setMode("SEARCH")}>
            <div className="flex items-center justify-center">
              <Search size="24" />
            </div>
          </IconButton>
          <IconButton
            onClick={() => {
              mapProxy.polygon = null
              localStorage.setItem(BUILDX_LOCAL_STORAGE_MAP_POLYGON_KEY, "null")
              vectorSource.clear()
            }}
          >
            <div className="flex items-center justify-center">
              <TrashCan size="24" />
            </div>
          </IconButton>
        </div>
      )}
      <Snackbar
        autoHideDuration={6000}
        open={snack}
        onClose={() => void setSnack(false)}
        message="Draw your site boundary"
      />
      {mapPolygon !== null && (
        <div className="absolute bottom-0 right-0 w-64">
          <Link href="/design" legacyBehavior>
            <a>
              <div className="flex items-center justify-between bg-white p-2 text-black">
                <div className="text-lg">Continue</div>
                <div>
                  <ArrowRight size="24" />
                </div>
              </div>
            </a>
          </Link>
          <div className="bg-black p-2 text-white opacity-50">
            You will be able to change this boundary again at any time
          </div>
        </div>
      )}
    </div>
  )
}

export default LocateIndex
