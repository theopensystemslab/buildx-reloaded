import IconButton from "@/ui/common/IconButton"
import { ChevronRight, TrashCan } from "@carbon/icons-react"
import MapboxDraw from "@mapbox/mapbox-gl-draw"
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css"
import { centerOfMass, distance, Feature, Geometry } from "@turf/turf"
import { pipe } from "fp-ts/lib/function"
import { Fragment, useEffect, useState } from "react"
import usePortal from "react-cool-portal"
import { Layer, MapRef, Source, useControl } from "react-map-gl"
import { useEvent } from "react-use"
import { A, O } from "@/utils/functions"
import useFlyTo, { flyToDefaultOpts } from "../hooks/useFlyTo"
import { LocateEvents } from "../state/events"
import { polygonFeatureParser } from "../state/geojson"
import { setMapPolygon, trashMapPolygon, useMapPolygon } from "../state/polygon"
import { polygonDrawStyles } from "./mapStyles"
import Link from "next/link"

type Props = {
  leftMenuContainerId: string
  topLeftContainerId: string
  bottomRightContainerId: string
}

const PolygonControl = (props: Props) => {
  const { leftMenuContainerId, topLeftContainerId, bottomRightContainerId } =
    props

  const [labelDataFeatures, setLabelDataFeatures] = useState<
    Feature<Geometry>[]
  >([])

  const updateLabels = () => {
    if (draw) {
      const features = draw.getAll()
      const newLabelDataFeatures: Feature<Geometry>[] = []

      features.features.forEach((feature) => {
        if (feature.geometry.type === "Polygon") {
          const coordinates = feature.geometry.coordinates[0]
          for (let i = 0; i < coordinates.length - 1; i++) {
            const from = coordinates[i]
            const to = coordinates[i + 1]
            const segmentDistance = distance(from, to, { units: "meters" })
            const midPoint: [number, number] = [
              (from[0] + to[0]) / 2,
              (from[1] + to[1]) / 2,
            ]

            newLabelDataFeatures.push({
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: midPoint,
              },
              properties: {
                label: `${segmentDistance.toFixed(2)} m`,
              },
              id: `${feature.id}-${i}`,
            })
          }
        }
      })

      setLabelDataFeatures(newLabelDataFeatures)
    }
  }

  const newPolygon = () => {
    pipe(
      draw.getAll().features,
      A.head,
      O.map((feature) => {
        const result = polygonFeatureParser.safeParse(feature)
        if (result.success) {
          setMapPolygon(result.data.geometry)
        }
      })
    )
    updateLabels()
  }

  const drawCreateHandler = newPolygon
  const drawUpdateHandler = newPolygon

  const draw = useControl<MapboxDraw>(
    () =>
      new MapboxDraw({
        styles: polygonDrawStyles,
        displayControlsDefault: false,
      }),
    // onCreate
    ({ map }: { map: MapRef }) => {
      map.on("draw.create", drawCreateHandler)
      map.on("draw.update", drawUpdateHandler)
      map.on("draw.delete", updateLabels)
      map.on("mousemove", updateLabels)
    },
    // onRemove
    ({ map }: { map: MapRef }) => {
      map.off("draw.create", drawCreateHandler)
      map.off("draw.update", drawUpdateHandler)
      map.off("draw.delete", updateLabels)
      map.off("mousemove", updateLabels)
    }
  )

  const [drawMode, setDrawMode] = useState<"simple_select" | "draw_polygon">(
    "simple_select"
  )

  const syncMode = () => {
    draw.changeMode(drawMode as any)
  }

  useEffect(syncMode, [draw, drawMode])

  const enableDrawPolygonMode = () => {
    trash()
  }

  useEvent(LocateEvents.Enum.GeocoderEntered, enableDrawPolygonMode)
  useEvent(LocateEvents.Enum.GeocoderClickAway, enableDrawPolygonMode)

  const { Portal: LeftMenuPortal } = usePortal({
    containerId: leftMenuContainerId,
    autoRemoveContainer: false,
    internalShowHide: false,
  })

  const { Portal: TopLeftPortal } = usePortal({
    containerId: topLeftContainerId,
    autoRemoveContainer: false,
    internalShowHide: false,
  })

  const { Portal: BottomRightPortal } = usePortal({
    containerId: bottomRightContainerId,
    autoRemoveContainer: false,
    internalShowHide: false,
  })

  const mapPolygon = useMapPolygon()

  const trash = () => {
    trashMapPolygon()
    draw.deleteAll()
    setDrawMode("draw_polygon")
    syncMode()
    updateLabels()
  }

  const flyTo = useFlyTo()

  useEffect(() => {
    if (mapPolygon !== null) {
      draw.add({
        type: "FeatureCollection",
        features: [
          {
            geometry: mapPolygon,
            properties: {},
            type: "Feature",
          },
        ],
      })

      const {
        geometry: {
          coordinates: [lng, lat],
        },
      } = centerOfMass(mapPolygon)

      flyTo([lng, lat])

      const timeout = setTimeout(() => {
        updateLabels()
      }, (flyToDefaultOpts.duration ?? 0) - 1000)

      return () => {
        clearTimeout(timeout)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draw])

  return (
    <Fragment>
      <Source
        key="label-data"
        id="label-data"
        type="geojson"
        data={{
          type: "FeatureCollection",
          features: labelDataFeatures as any,
        }}
      >
        <Layer
          key="segment-labels"
          id="segment-labels"
          type="symbol"
          layout={{
            "text-field": ["get", "label"],
            "text-size": 12,
            "text-anchor": "bottom",
            "text-offset": [0, -1.5],
            "text-allow-overlap": true,
          }}
          paint={{
            "text-color": "#fff",
            "text-halo-width": 2,
          }}
        />
      </Source>
      {mapPolygon === null && drawMode === "draw_polygon" && (
        <TopLeftPortal>
          <div>
            <h2>Draw the outline of your site</h2>
          </div>
        </TopLeftPortal>
      )}

      {mapPolygon !== null && (
        <Fragment>
          <LeftMenuPortal>
            <IconButton onClick={trash}>
              <div className="flex items-center justify-center">
                <TrashCan size={24} />
              </div>
            </IconButton>
          </LeftMenuPortal>
          <BottomRightPortal>
            <Link
              href={`/design`}
              className="bg-white text-grey-100 px-5 py-3 font-semibold flex justify-between pb-12 tracking-wide pointer-events-auto"
            >
              <div>Continue to design</div>
              <ChevronRight size="20" className="ml-16" />
            </Link>
          </BottomRightPortal>
        </Fragment>
      )}
    </Fragment>
  )
}

export default PolygonControl
