import MapboxDraw from "@mapbox/mapbox-gl-draw"
import type { ControlPosition, MapRef } from "react-map-gl"
import { useControl } from "react-map-gl"
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css"

const noop = () => {}

type DrawControlProps = ConstructorParameters<typeof MapboxDraw>[0] & {
  position?: ControlPosition
  onCreate?: (evt: { features: object[] }) => void
  onUpdate?: (evt: { features: object[]; action: string }) => void
  onDelete?: (evt: { features: object[] }) => void
}

const DrawControls = (props: DrawControlProps) => {
  const {
    onCreate = noop,
    onUpdate = noop,
    onDelete = noop,
    position = "top-left",
  } = props

  const drawStyles2 = [
    // ACTIVE (being drawn)
    // polygon fill
    {
      id: "gl-draw-polygon-fill",
      type: "fill",
      filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
      paint: {
        "fill-color": "rgba(255, 255, 255, 0.5)",
        "fill-outline-color": "#ffffff",
      },
    },
    // polygon outline stroke
    {
      id: "gl-draw-polygon-stroke-active",
      type: "line",
      filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
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
  ]

  const drawStyles = [
    // Polygon fill
    {
      id: "gl-draw-polygon-fill",
      type: "fill",
      filter: ["all", ["==", "$type", "Polygon"], ["==", "meta", "user"]],
      paint: {
        "fill-color": "rgba(255, 255, 255, 0.2)",
      },
    },
    // Polygon outline
    {
      id: "gl-draw-polygon-stroke",
      type: "line",
      filter: ["all", ["==", "$type", "Polygon"], ["==", "meta", "user"]],
      paint: {
        "line-color": "#fff",
        "line-width": 2,
      },
    },
    // Vertices
    {
      id: "gl-draw-points",
      type: "circle",
      filter: ["all", ["==", "$type", "Point"], ["==", "meta", "vertex"]],
      paint: {
        "circle-radius": 5,
        "circle-color": "white",
      },
    },
    // Segment distance labels
    {
      id: "gl-draw-line-label",
      type: "symbol",
      filter: [
        "all",
        ["==", "$type", "LineString"],
        ["==", "meta", "midpoint"],
      ],
      layout: {
        "text-field": "{label}",
        "text-font": ["Calibri", "sans-serif"],
        "text-size": 12,
        "text-anchor": "bottom",
        "text-offset": [0, -1.5],
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "rgba(255, 255, 255, 1)",
        "text-halo-color": "rgba(0, 0, 0, 0.4)",
        "text-halo-width": 2,
        "text-halo-blur": 0,
      },
    },
  ]

  useControl<MapboxDraw>(
    () =>
      new MapboxDraw({
        ...props,
        styles: drawStyles2,
        // styles: [],
      }),
    ({ map }: { map: MapRef }) => {
      map.on("draw.create", onCreate)
      map.on("draw.update", onUpdate)
      map.on("draw.delete", onDelete)
    },
    ({ map }: { map: MapRef }) => {
      map.off("draw.create", onCreate)
      map.off("draw.update", onUpdate)
      map.off("draw.delete", onDelete)
    },
    {
      position,
    }
  )

  return null
}

export default DrawControls
