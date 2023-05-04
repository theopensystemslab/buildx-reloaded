import IconButton from "@/ui/common/IconButton"
import { TrashCan } from "@carbon/icons-react"
import MapboxDraw from "@mapbox/mapbox-gl-draw"
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css"
import { centerOfMass, distance, Feature, Geometry } from "@turf/turf"
import { pipe } from "fp-ts/lib/function"
import { Fragment, useEffect, useState } from "react"
import usePortal from "react-cool-portal"
import { Layer, MapRef, Source, useControl, useMap } from "react-map-gl"
import { useEvent } from "react-use"
import { A, O, R } from "../../../src/utils/functions"
import useFlyTo, { flyToDefaultOpts } from "../hooks/useFlyTo"
import { LocateEvents } from "../state/events"
import { polygonFeatureParser } from "../state/geojson"
import { setMapPolygon, trashMapPolygon, useMapPolygon } from "../state/polygon"
import { polygonDrawStyles } from "./mapStyles"

type Props = {
  leftMenuContainerId: string
  topLeftContainerId: string
}

const PolygonControl = (props: Props) => {
  const { leftMenuContainerId, topLeftContainerId } = props

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
  }

  const draw = useControl<MapboxDraw>(
    () =>
      new MapboxDraw({
        styles: polygonDrawStyles,
        displayControlsDefault: false,
      }),
    // onCreate
    ({ map }: { map: MapRef }) => {
      map.on("draw.create", () => {
        updateLabels()
        newPolygon()
      })
      map.on("draw.update", () => {
        updateLabels()
        newPolygon()
      })
      map.on("draw.delete", updateLabels)
      // map.on("mousemove", updateLabels)
    },
    // onRemove
    ({ map }: { map: MapRef }) => {
      map.off("draw.create", updateLabels)
      map.off("draw.update", updateLabels)
      map.off("draw.delete", updateLabels)
      // map.off("mousemove", updateLabels)
    }
  )

  const [drawMode, setDrawMode] = useState<"simple_select" | "draw_polygon">(
    "simple_select"
  )

  useEffect(() => {
    draw.changeMode(drawMode as any)
  }, [draw, drawMode])

  const enableDrawPolygonMode = () => {
    setDrawMode("draw_polygon")
  }

  useEvent(LocateEvents.Enum.GeocoderEntered, enableDrawPolygonMode)
  useEvent(LocateEvents.Enum.GeocoderClickAway, enableDrawPolygonMode)

  // useSubscribeLocateState((locateState) => {
  //   switch (locateState) {
  //     case "DRAWING_POLYGON":
  //       console.log("DRAWING_POLYGON")
  //       draw.changeMode("draw_polygon")
  //       break
  //     default:
  //       console.log("OTHER")
  //       draw.changeMode("simple_select")
  //       break
  //   }
  // })

  // TODO: complete me

  // const handleToggleDraw = () => {
  //   setDrawingEnabled(!drawingEnabled);
  //   draw.current.changeMode(drawingEnabled ? 'simple_select' : 'draw_polygon');
  // };

  // const handleDeleteDraw = () => {
  //   draw.current.deleteAll();
  // };

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

  const mapPolygon = useMapPolygon()
  // const locateState = useLocateState()

  const trash = () => {
    trashMapPolygon()
    draw.deleteAll()
    setDrawMode("draw_polygon")
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
        <LeftMenuPortal>
          <IconButton onClick={trash}>
            <div className="flex items-center justify-center">
              <TrashCan size={24} />
            </div>
          </IconButton>
        </LeftMenuPortal>
      )}
    </Fragment>
  )
}

export default PolygonControl
