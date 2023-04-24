import MapboxDraw from "@mapbox/mapbox-gl-draw"
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css"
import { distance, Feature } from "@turf/turf"
import { Fragment, useState } from "react"
import { Layer, MapRef, Source, useControl } from "react-map-gl"

const DrawControls = () => {
  const [labelData, setLabelData] = useState<Feature[]>([])

  const updateLabels = () => {
    if (draw) {
      const features = draw.getAll()
      const newLabelData: Feature[] = []

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

            newLabelData.push({
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

      setLabelData(newLabelData)
    }
  }

  const draw = useControl<MapboxDraw>(
    () =>
      new MapboxDraw({
        styles: [
          // ACTIVE (being drawn)
          // polygon fill
          {
            id: "gl-draw-polygon-fill",
            type: "fill",
            filter: [
              "all",
              ["==", "$type", "Polygon"],
              ["!=", "mode", "static"],
            ],
            paint: {
              "fill-color": "rgba(255, 255, 255, 0.5)",
              "fill-outline-color": "#ffffff",
            },
          },
          // polygon outline stroke
          {
            id: "gl-draw-polygon-stroke-active",
            type: "line",
            filter: [
              "all",
              ["==", "$type", "Polygon"],
              ["!=", "mode", "static"],
            ],
            layout: {
              "line-cap": "round",
              "line-join": "round",
            },
            paint: {
              "line-color": "#ffffff",
              "line-width": 2,
            },
          },
          // vertex point halos
          {
            id: "gl-draw-polygon-and-line-vertex-halo-active",
            type: "circle",
            filter: [
              "all",
              ["==", "meta", "vertex"],
              ["==", "$type", "Point"],
              ["!=", "mode", "static"],
            ],
            paint: {
              "circle-radius": 5,
              "circle-color": "#ffffff",
            },
          },
          // vertex points
          {
            id: "gl-draw-polygon-and-line-vertex-active",
            type: "circle",
            filter: [
              "all",
              ["==", "meta", "vertex"],
              ["==", "$type", "Point"],
              ["!=", "mode", "static"],
            ],
            paint: {
              "circle-radius": 3,
              "circle-color": "#ffffff",
            },
          },
        ],
      }),
    // onCreate
    ({ map }: { map: MapRef }) => {
      map.on("draw.create", updateLabels)
      map.on("draw.update", updateLabels)
      map.on("draw.delete", updateLabels)
      map.on("mousemove", updateLabels)
    },
    // onRemove
    ({ map }: { map: MapRef }) => {
      map.off("draw.create", updateLabels)
      map.off("draw.update", updateLabels)
      map.off("draw.delete", updateLabels)
      map.off("mousemove", updateLabels)
      setLabelData([])
    }
  )

  return (
    <Fragment>
      <Source
        key="foo-source"
        id="label-data"
        type="geojson"
        data={{
          type: "FeatureCollection",
          features: labelData as any,
        }}
      >
        <Layer
          key="foo-layer"
          id="segment-labels"
          type="symbol"
          layout={{
            "text-field": ["get", "label"],
            "text-size": 12,
            "text-anchor": "bottom",
            "text-offset": [0, -1.5],
          }}
          paint={{
            "text-color": "rgba(255, 255, 255, 1)",
            "text-halo-color": "rgba(0, 0, 0, 0.4)",
            "text-halo-width": 1,
            "text-halo-blur": 1,
          }}
        />
      </Source>
    </Fragment>
  )
}

export default DrawControls
