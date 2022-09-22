import { DEFAULT_ORIGIN } from "@/constants"
import globals, { useGlobals } from "@/hooks/globals"
import CameraSync from "@/threebox/camera/CameraSync"
import utils from "@/threebox/utils/utils"
import { advance, useThree } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { useEffect, useMemo, useRef } from "react"
import { useKey } from "react-use"
import { Group, Raycaster } from "three"
import { useHouses } from "../hooks/houses"
import { RA, RR } from "../utils/functions"
import IfcHouse from "./IfcHouse"
import Lighting from "./Lighting"
import RectangularGrid from "./RectangularGrid"
import { subscribeKey } from "valtio/utils"
import ifcStore from "../hooks/ifc"
import { ref } from "valtio"

const R3FApp = () => {
  const worldRef = useRef<Group>(null)
  const { camera, setSize } = useThree()
  const { size, mapboxMap } = useGlobals()

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
    <group ref={worldRef}>
      <group
        ref={(scene) => {
          if (scene) globals.scene = ref(scene)
        }}
        scale={perMeter}
        position={mapCenter}
        rotation-x={Math.PI / 2}
      >
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
