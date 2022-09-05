import { DEFAULT_ORIGIN } from "@/constants"
import { reverseV2 } from "@/utils/math"
import {
  addAfterEffect,
  addEffect,
  advance,
  createRoot,
  events,
  extend,
  ReconcilerRoot,
  RenderProps,
} from "@react-three/fiber"
import mapboxgl, { AnyLayer } from "mapbox-gl"
import {
  Fragment,
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { BasicShadowMap, sRGBEncoding } from "three"
import Lighting from "./Lighting"
import * as THREE from "three"
import { useKey } from "react-use"
import "mapbox-gl/dist/mapbox-gl.css"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!

extend(THREE)

const mapboxStyleUrl = "mapbox://styles/mapbox/streets-v11"

type Props = PropsWithChildren<RenderProps<HTMLCanvasElement>>

const ToggleCanvas = (props: Props) => {
  const { children, ...canvasProps } = props

  const [mapElement, setMapElement] = useState<HTMLDivElement | null>(null)

  const [map, setMap] = useState<mapboxgl.Map | undefined>()
  const [root, setRoot] = useState<
    ReconcilerRoot<HTMLCanvasElement> | undefined
  >()

  const toggleAllLayers = useCallback(
    (b: boolean) => {
      console.log(`toggle all layers ${b}`)
      if (!map) return

      const style = map.getStyle()
      console.log(style)
      if (!style) return

      for (const layer of map.getStyle().layers) {
        console.log("layer")
        map.setLayoutProperty(layer.id, "visibility", b ? "visible" : "none")
      }

      map.triggerRepaint()
      advance(Date.now(), true)
    },
    [map]
  )

  const mapboxEnabled = useRef(true)

  useKey(
    "m",
    () => {
      console.log("m")
      mapboxEnabled.current = !mapboxEnabled.current

      toggleAllLayers(mapboxEnabled.current)
      // map?.setStyle(
      //   mapboxEnabled.current
      //     ? mapboxStyleUrl
      //     : "mapbox://styles/mapbox/empty-v8"
      // )
      // toggleAllLayers(mapboxEnabled.current)
    },
    undefined,
    [map]
  )

  useEffect(() => {
    if (!mapElement) return

    if (!map) {
      setMap(
        new mapboxgl.Map({
          container: mapElement, // container ID
          style: mapboxStyleUrl, // style URL
          center: reverseV2(DEFAULT_ORIGIN), // starting position [lng, lat]
          zoom: 18, // starting zoom
          antialias: true,
          interactive: true,
        })
      )
    }
    if (!map) return

    // const size = { width: window.innerWidth, height: window.innerHeight }
    const canvas = mapElement.querySelector("canvas")

    if (!canvas) return

    if (!root) setRoot(createRoot(canvas))
    if (!root) return

    const customLayer: AnyLayer = {
      id: "custom_layer",
      type: "custom",
      renderingMode: "3d",
      onAdd: function (map, context) {
        root.configure({
          events,
          frameloop: "never",
          shadows: {
            enabled: true,
            type: BasicShadowMap,
          },
          gl: {
            alpha: true,
            antialias: true,
            autoClear: false,
            canvas: map.getCanvas(),
            context,
            outputEncoding: sRGBEncoding,
            preserveDrawingBuffer: true,
            localClippingEnabled: true,
          },
          size: {
            width: map.getCanvas().clientWidth,
            height: map.getCanvas().clientHeight,
            top: 0,
            left: 0,
          },
          onCreated: (state: any) => {
            state.events.connect?.(mapElement)
            addEffect(() => state.gl.resetState())
            addAfterEffect(() => map.triggerRepaint())

            state.gl.localClippingEnabled = true
            // state.raycaster.layers.enable(RaycasterLayer.clickable)
            // state.raycaster.layers.disable(RaycasterLayer.non_clickable)
          },
          ...canvasProps,
        })

        map.repaint = false

        root.render(
          <Fragment>
            {/* <MapboxThreeAppThreeTree /> */}
            {/* <axesHelper /> */}
            <Lighting />
            {/* <group position={[0.5, 0, 0.5]}> */}
            {/* <RectangularGrid
              x={{ cells: 61, size: 1 }}
              z={{ cells: 61, size: 1 }}
              color="#ababab"
            /> */}
            {/* </group> */}
            {/* <HorizontalPlane
              onChange={setXZ}
              onNearClick={() => {
                menu.open = false
                scope.selected = null
                clearIlluminatedMaterials()
              }}
              onNearHover={() => {
                if (menu.open) return
                scope.hovered = null
                if (scope.selected === null) clearIlluminatedMaterials()
              }}
            /> */}
            {/* {shadows && (
              <>
                <GroundCircle />
                <ShadowPlane />
              </>
            )} */}
            {/* {boundary && <lineLoop args={[boundary, boundaryMaterial]} />} */}
            {/* <Effects /> */}
            {children}
          </Fragment>
        )
      },
      render: (ctx?: WebGLRenderingContext, matrix?: number[]): void => {
        advance(Date.now(), true)
        map.triggerRepaint()
      },
    }

    const minZoom = 12

    // const buildingsLayer: AnyLayer = {
    //   id: "3d-buildings",
    //   source: "composite",
    //   "source-layer": "building",
    //   filter: ["==", "extrude", "true"],
    //   type: "fill-extrusion",
    //   minzoom: minZoom,
    //   paint: {
    //     "fill-extrusion-color": [
    //       "case",
    //       ["boolean", ["feature-state", "select"], false],
    //       "lightgreen",
    //       ["boolean", ["feature-state", "hover"], false],
    //       "lightblue",
    //       "#aaa",
    //     ],

    //     // use an 'interpolate' expression to add a smooth transition effect to the
    //     // buildings as the user zooms in
    //     "fill-extrusion-height": [
    //       "interpolate",
    //       ["linear"],
    //       ["zoom"],
    //       minZoom,
    //       0,
    //       minZoom + 0.05,
    //       ["get", "height"],
    //     ],
    //     "fill-extrusion-base": [
    //       "interpolate",
    //       ["linear"],
    //       ["zoom"],
    //       minZoom,
    //       0,
    //       minZoom + 0.05,
    //       ["get", "min_height"],
    //     ],
    //     "fill-extrusion-opacity": 0.9,
    //   },
    // }

    map.on("style.load", (e) => {
      // console.log("styledata", e)
      // map.setFog({}) // Set the default atmosphere style
      // map.addLayer(buildingsLayer)
      console.log("adding custom layer")
      map.addLayer(customLayer)
      // const style = map.getStyle()
      // console.log(style)
    })

    return () => root.unmount()
  }, [canvasProps, children, map, mapElement, root, setMap, setRoot])

  return (
    <div className="absolute h-full w-full">
      <div ref={setMapElement} className="h-full w-full" />
    </div>
  )
}

export default ToggleCanvas
