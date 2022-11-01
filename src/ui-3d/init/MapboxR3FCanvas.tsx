import { DEFAULT_ORIGIN } from "@/constants"
import mapboxStore, { setMapboxMap } from "@/hooks/mapboxStore"
import {
  addAfterEffect,
  addEffect,
  advance,
  createRoot,
  events,
  extend,
  ReconcilerRoot,
  RenderProps,
  RootState,
} from "@react-three/fiber"
import mapboxgl, { AnyLayer } from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { PropsWithChildren, useEffect, useState } from "react"
import * as THREE from "three"
import { BasicShadowMap, sRGBEncoding } from "three"
import { reverseV2 } from "../../utils/math"
import { onCreated } from "../../utils/three"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!

extend(THREE)

const mapboxStyleUrl =
  "mapbox://styles/mysterybear/cl7oys94w001c15obt2vozspx/draft"
// "mapbox://styles/mysterybear/cl837pv57007914n5k67jft02/draft"

type Props = PropsWithChildren<RenderProps<HTMLCanvasElement>>

const MapboxR3FCanvas = (props: Props) => {
  const { children, ...canvasProps } = props

  const [mapElement, setMapElement] = useState<HTMLDivElement | null>(null)

  const [root, setRoot] = useState<
    ReconcilerRoot<HTMLCanvasElement> | undefined
  >()

  // const toggleAllLayers = useCallback((b: boolean) => {
  //   if (!mapboxStore.mapboxMap) return
  //   const style = mapboxStore.mapboxMap.getStyle()
  //   if (!style) return

  //   for (const layer of mapboxStore.mapboxMap.getStyle().layers) {
  //     mapboxStore.mapboxMap.setLayoutProperty(
  //       layer.id,
  //       "visibility",
  //       b ? "visible" : "none"
  //     )
  //   }
  // }, [])

  // const mapboxEnabled = useRef(true)

  // useKey("m", () => {
  //   mapboxEnabled.current = !mapboxEnabled.current
  //   toggleAllLayers(mapboxEnabled.current)
  // })

  useEffect(() => {
    if (!mapElement) return

    if (!mapboxStore.mapboxMap) {
      setMapboxMap(
        new mapboxgl.Map({
          container: mapElement, // container ID
          style: mapboxStyleUrl, // style URL
          center: reverseV2(DEFAULT_ORIGIN), // starting position [lng, lat]
          zoom: 20, // starting zoom
          antialias: true,
          interactive: true,
          pitch: 45, // pitch in degrees
          bearing: -45, // bearing in degrees
        })
      )
    }
    if (!mapboxStore.mapboxMap) return

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
          onCreated: (state: RootState) => {
            onCreated(state)
            state.events.connect?.(mapElement)
            addEffect(() => state.gl.resetState())
            addAfterEffect(() => map.triggerRepaint())
          },
          ...canvasProps,
        })
        map.repaint = false
        root.render(children)
      },
      render: (ctx?: WebGLRenderingContext, matrix?: number[]): void => {
        advance(Date.now(), true)
      },
    }

    mapboxStore.mapboxMap.on("style.load", (e) => {
      mapboxStore.mapboxMap!.getCanvas().style.cursor = "default"
      mapboxStore.mapboxMap!.addLayer(customLayer)
    })

    return () => {
      root.unmount()
      mapElement.innerHTML = ""
      mapboxStore.mapboxMap = null
    }
  }, [canvasProps, children, mapElement, root, setRoot])

  return <div ref={setMapElement} className="h-full w-full" />
}

export default MapboxR3FCanvas
