import { DEFAULT_ORIGIN } from "@/constants"
import globals from "@/hooks/globals"
import CameraSync from "@/threebox/camera/CameraSync"
import utils from "@/threebox/utils/utils"
import { useThree } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { useEffect, useRef } from "react"
import { Group } from "three"
import { useSnapshot } from "valtio"
import { useHouses } from "../hooks/houses"
import { RA, RR } from "../utils/functions"
import IfcHouse from "./IfcHouse"
import Lighting from "./Lighting"
import RectangularGrid from "./RectangularGrid"

const R3FApp = () => {
  const worldRef = useRef<Group>(null)
  const camera = useThree((t) => t.camera)

  const { mapboxMap } = useSnapshot(globals)

  useEffect(() => {
    if (!globals.cameraSync && worldRef.current) {
      globals.cameraSync = new CameraSync(mapboxMap, camera, worldRef.current)
    }
  }, [camera, mapboxMap])

  const [lat, lng] = DEFAULT_ORIGIN

  const mapCenter = pipe(utils.projectToWorld([lng, lat]), (v3) => {
    return v3
  })

  const perMeter = utils.projectedUnitsPerMeter(lat)

  const houses = useHouses()

  const children = pipe(
    houses,
    RR.keys,
    RA.map((id) => <IfcHouse key={id} id={id} />)
  )

  return (
    <group ref={worldRef}>
      <group scale={perMeter} position={mapCenter} rotation-x={Math.PI / 2}>
        <axesHelper />
        <Lighting />
        <RectangularGrid
          x={{ cells: 61, size: 1 }}
          z={{ cells: 61, size: 1 }}
          color="#ababab"
        />
        {children}
      </group>
    </group>
  )
}

export default R3FApp

// import { replicate } from "fp-ts/lib/Array"
// import { pipe } from "fp-ts/lib/function"
// import React from "react"

// type M = {
//   // incorporating blank space
//   length: number // grid units
//   height: number // grid units
//   width: number // grid units
//   matrix: boolean[][][]
// }

// const newM = ({
//   length,
//   height,
//   width,
// }: {
//   length: number
//   height: number
//   width: number
// }): M => ({
//   length,
//   width,
//   height,
//   matrix: pipe(
//     replicate(length, false),
//     (xs) => replicate(height, xs),
//     (ys) => replicate(width, ys)
//   ),
// })

// // const m1: M = {
// //   length: 3,
// //   width: 1,
// //   height: 1,
// //   spaceMatrix:
// // }

// // validate that the fillMatrix is actually l * w * h?

// const lengthHeightToWidth1 = (input: boolean[][]): boolean[][][] => [input]

// // maybe we pass lines of boolean
// // lines of lines of boolean
// // lines of lines of lines of boolean

// const R3FApp = () => {
//   const L = [
//     [true, false, false],
//     [true, true, true],
//   ]

//   console.log(newM({ length: 3, height: 2, width: 1 }))
//   return (
//     <mesh>
//       <boxBufferGeometry />
//       <meshBasicMaterial color="skyblue" />
//     </mesh>
//   )
// }

// export default R3FApp
