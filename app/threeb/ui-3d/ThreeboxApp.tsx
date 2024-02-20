"use client"
import { useRef } from "react"
import "threebox-plugin/dist/threebox"
import { DEFAULT_ORIGIN } from "~/locate/state/constants"
import useThreebox from "./useThreebox"

const ThreeboxApp = () => {
  const containerRef = useRef<HTMLDivElement>(null)

  useThreebox({
    containerRef,
    onInit: (tb) => {
      const [longitude, latitude] = DEFAULT_ORIGIN

      const origin: [number, number] = [longitude, latitude]

      const lineGeometry: number[][] = []

      for (var l = 0; l < 200; l++) {
        var delta = [
          (Math.sin(l / 5) * l) / 40,
          (Math.cos(l / 5) * l) / 40,
          l / 10,
        ]

        var newCoordinate = origin.map(function (d, i) {
          return d + delta[i]
        })
        lineGeometry.push(newCoordinate)
      }

      console.log("Tube's line geometry: ", lineGeometry)

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
  })

  return (
    <div className="absolute w-full h-full  bg-white overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}

export default ThreeboxApp
