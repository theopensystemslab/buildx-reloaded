import mapboxgl from "mapbox-gl"
import { RefObject, useEffect, useRef } from "react"
import { DEFAULT_ORIGIN } from "~/locate/state/constants"

type Threebox = any

export const getThreebox = () => {
  // @ts-ignore
  return window?.tb as Threebox | undefined
}

type Args = {
  onInit: (tb: Threebox) => void
  containerRef: RefObject<HTMLDivElement>
}

const useThreebox = ({ containerRef, onInit }: Args) => {
  const runOnce = useRef(false)

  useEffect(() => {
    if (runOnce.current) return

    if (!containerRef.current) return

    const container = containerRef.current

    const map = new mapboxgl.Map({
      accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!,
      container,
      center: DEFAULT_ORIGIN,
      zoom: 20,
      pitch: 60,
      // style: "mapbox://styles/mapbox/streets-v9",
      style: "mapbox://styles/mapbox/outdoors-v11",
      antialias: true,
    })

    map.on("style.load", () => {
      let minZoom = 12
      let mapConfig = {
        ALL: {
          center: [-73.985699, 40.750042, 0],
          zoom: 16.25,
          pitch: 45,
          bearing: 0,
        },
        names: {
          compositeSource: "composite",
          compositeSourceLayer: "building",
          compositeLayer: "3d-buildings",
        },
      }
      function createCompositeLayer(): any {
        let layer = {
          id: mapConfig.names.compositeLayer,
          source: mapConfig.names.compositeSource,
          "source-layer": mapConfig.names.compositeSourceLayer,
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: minZoom,
          paint: {
            "fill-extrusion-color": [
              "case",
              ["boolean", ["feature-state", "select"], false],
              "lightgreen",
              ["boolean", ["feature-state", "hover"], false],
              "lightblue",
              "#aaa",
            ],

            // use an 'interpolate' expression to add a smooth transition effect to the
            // buildings as the user zooms in
            "fill-extrusion-height": [
              "interpolate",
              ["linear"],
              ["zoom"],
              minZoom,
              0,
              minZoom + 0.05,
              ["get", "height"],
            ],
            "fill-extrusion-base": [
              "interpolate",
              ["linear"],
              ["zoom"],
              minZoom,
              0,
              minZoom + 0.05,
              ["get", "min_height"],
            ],
            "fill-extrusion-opacity": 0.9,
          },
        }
        return layer
      }
      map.addLayer(createCompositeLayer())
      map.addLayer({
        id: "custom_layer",
        type: "custom",
        renderingMode: "3d",
        onAdd: async function (map, mbxContext) {
          // @ts-ignore
          window.tb = new Threebox(map, mbxContext, {
            defaultLights: true,
            enableSelectingObjects: true, // change this to false to disable 3D objects selection
            enableDraggingObjects: true, // change this to false to disable 3D objects drag & move once selected
            enableRotatingObjects: true, // change this to false to disable 3D objects rotation once selected
            enableTooltips: false, // change this to false to disable default tooltips on fill-extrusion and 3D models
            enableHelpTooltips: false, // remove this to disable default help tooltips for draggin, rotating and measure
          })

          // @ts-ignore
          onInit(window.tb)
        },

        render: function (gl, matrix) {
          // @ts-ignore
          const tb = window.tb
          tb.update()
        },
      })
    })

    runOnce.current = true
  }, [containerRef, onInit])
}

export default useThreebox
