"use client"
import { useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"
import "threebox-plugin/dist/threebox"

const [longitude, latitude] = [-95.97299, 36.15031]

const origin: [number, number] = [longitude, latitude]

const lineGeometry: number[][] = []

for (var l = 0; l < 200; l++) {
  var delta = [(Math.sin(l / 5) * l) / 40, (Math.cos(l / 5) * l) / 40, l / 10]

  var newCoordinate = origin.map(function (d, i) {
    return d + delta[i]
  })
  lineGeometry.push(newCoordinate)
}

console.log("Tube's line geometry: ", lineGeometry)

const ThreeboxApp = () => {
  const ref = useRef<HTMLDivElement>(null)
  const runOnce = useRef(false)

  useEffect(() => {
    if (runOnce.current) return

    if (!ref.current) return

    const map = new mapboxgl.Map({
      accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!,
      container: ref.current,
      center: origin,
      zoom: 14,
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
      function createCompositeLayer() {
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
            enableSelectingObjects: true, //change this to false to disable 3D objects selection
            enableDraggingObjects: true, //change this to false to disable 3D objects drag & move once selected
            enableRotatingObjects: false, //change this to false to disable 3D objects rotation once selected
            enableTooltips: false, // change this to false to disable default tooltips on fill-extrusion and 3D models
            enableHelpTooltips: false, // remove this to disable default help tooltips for draggin, rotating and measure
          })

          const tb = window.tb

          var tubeOptions = {
            geometry: lineGeometry,
            radius: 0.8,
            sides: 8,
            material: "MeshPhysicalMaterial",
            color: "#00ffff",
            anchor: "center",
            // @ts-ignore
            side: THREE.DoubleSide,
          }

          let tube = tb.tube(tubeOptions)
          tube.setCoords(origin)
          // tube.material.wireframe = true
          tb.add(tube)

          // tube.set({ rotation: { x: 0, y: 0, z: 11520 }, duration: 2000 });
          function onObjectChanged(e: any) {
            let object = e.detail.object // the object that has changed
            let action = e.detail.action // the action that defines the change

            //do something in the UI such as changing a button state or updating the new position and rotation
            console.log({ object, action })
          }

          tube.addEventListener("ObjectChanged", onObjectChanged)
        },

        render: function (gl, matrix) {
          const tb = window.tb
          tb.update()
        },
      })
    })

    runOnce.current = true
  }, [])

  return (
    <div className="absolute w-full h-full  bg-white overflow-hidden">
      <div ref={ref} className="w-full h-full" />
    </div>
  )
}

export default ThreeboxApp
