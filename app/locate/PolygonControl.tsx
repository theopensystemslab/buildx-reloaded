import MapboxDraw from "@mapbox/mapbox-gl-draw"
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css"
import { distance, Feature, Geometry } from "@turf/turf"
import { Fragment, useState } from "react"
import { Layer, MapRef, Source, useControl } from "react-map-gl"
import { polygonDrawStyles } from "./mapStyles"

const PolygonControl = () => {
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

  const draw = useControl<MapboxDraw>(
    () =>
      new MapboxDraw({
        styles: polygonDrawStyles,
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
    }
  )

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
    </Fragment>
  )
}

export default PolygonControl
