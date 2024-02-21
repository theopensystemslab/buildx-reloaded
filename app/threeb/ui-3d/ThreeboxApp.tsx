"use client"
import { nanoid } from "nanoid"
import { useRef } from "react"
import { useKey } from "react-use"
import "threebox-plugin/dist/threebox"
import { useAllHouseTypes } from "~/db/systems"
import { useHouses } from "~/db/user"
import { DEFAULT_ORIGIN } from "~/locate/state/constants"
import useThreebox, { getThreebox } from "./useThreebox"
import { pipe } from "fp-ts/lib/function"
import { A, O, TO } from "~/utils/functions"
import { createHouseTransformsGroup } from "~/design/ui-3d/fresh/scene/houseTransformsGroup"

const ThreeboxApp = () => {
  const containerRef = useRef<HTMLDivElement>(null)

  useThreebox({
    containerRef,
    onInit: (tb) => {},
  })

  const houseTypes = useAllHouseTypes()
  const houses = useHouses()

  useKey(
    "h",
    async () => {
      const tb = getThreebox()
      if (!tb) return

      pipe(
        houseTypes,
        A.head,
        TO.fromOption,
        TO.chain(({ systemId, id: houseTypeId, dnas }) =>
          TO.fromTask(
            createHouseTransformsGroup({
              systemId,
              houseTypeId,
              dnas,
              activeElementMaterials: {},
              friendlyName: "foo",
              houseId: nanoid(),
            })
          )
        ),
        TO.map((htg) => {
          const [longitude, latitude] = DEFAULT_ORIGIN
          const origin: [number, number] = [longitude, latitude]
          const addMe = tb.Object3D({ obj: htg, units: "meters" })
          addMe.setCoords(origin)

          function onObjectMouseOver(e: any) {
            console.log(e)
          }

          addMe.addEventListener("ObjectMouseOver", onObjectMouseOver, false)

          console.log({ addMe })
          tb.add(addMe)
        })
      )()
    },

    undefined,
    [houseTypes, houses]
  )

  useKey("k", () => {
    // @ts-ignore
    const tb = window.tb as Threebox

    if (!tb) return

    console.log("am i calling me?")

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
  })
  return (
    <div className="absolute w-full h-full  bg-white overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}

export default ThreeboxApp
