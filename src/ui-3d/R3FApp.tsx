import { DEFAULT_ORIGIN } from "@/constants"
import globals, { useGlobals } from "@/hooks/globals"
import CameraSync from "@/threebox/camera/CameraSync"
import utils from "@/threebox/utils/utils"
import { useThree } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import dynamic from "next/dynamic"
import { Fragment, useEffect, useMemo, useRef } from "react"
import { Group, Raycaster } from "three"
import { subscribeKey } from "valtio/utils"
import { useHouses } from "../hooks/houses"
import ifcStore from "../hooks/ifc"
import { RA, RR } from "../utils/functions"
import IfcHouse from "./IfcHouse"
import Lighting from "./Lighting"
import RectangularGrid from "./RectangularGrid"

const DataPreload = dynamic(() => import("@/data/DataPreload"), { ssr: false })

const R3FApp = () => {
  const worldRef = useRef<Group>(null)
  const { camera, setSize } = useThree()
  const { size, mapboxMap, preload } = useGlobals()

  useEffect(() => {
    if (size === null) return
    const { width, height } = size
    setSize(width, height)
    globals.cameraSync = new CameraSync(mapboxMap, camera, worldRef.current)
  }, [camera, mapboxMap, setSize, size])

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

  const raycaster = useMemo(() => new Raycaster(), [])

  useEffect(() => {
    return subscribeKey(globals, "pointerXY", () => {
      // console.log(ifcStore.models)
      const [x, y] = globals.pointerXY
      raycaster.setFromCamera({ x, y }, camera)
      const ifcModels = Object.values(ifcStore.models)
      const foo = raycaster.intersectObjects(ifcModels)
      if (foo.length > 1) console.log(foo)
    })
  }, [camera, raycaster])

  return (
    <Fragment>
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
      {preload && <DataPreload />}
    </Fragment>
  )
}

export default R3FApp
