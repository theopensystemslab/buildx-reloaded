import DataInit from "@/data/DataInit"
import DefaultApp from "@/ui-3d/default/DefaultApp"
import AppInit from "@/ui-3d/init/AppInit"
import { ThreeEvent } from "@react-three/fiber"
import { useDrag } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { Fragment, useEffect, useRef } from "react"
import { useKey } from "react-use"
import { DoubleSide, Mesh, Vector3 } from "three"
import { setCameraEnabled } from "../src/hooks/camera"
import { useGlobals } from "../src/hooks/globals"
import hashedMaterials from "../src/hooks/hashedMaterials"
import DebugDimensions from "../src/ui-3d/debug/DebugDimensions"
import { RR } from "../src/utils/functions"
import { PI } from "../src/utils/math"

const Main = () => {
  const ref = useRef<Mesh>(null)

  const yAxis = new Vector3(0, 1, 0)

  useKey("r", () => {
    const theta = PI / 8
    ref.current!.position.applyAxisAngle(yAxis, theta)
    ref.current!.rotateOnAxis(yAxis, theta)
  })

  const bind: any = useDrag<ThreeEvent<PointerEvent>>(
    ({ event: { uv }, first, last }) => {
      if (first) setCameraEnabled(false)
      if (last) setCameraEnabled(true)

      if (!uv) return

      const { x, y: z } = uv

      const x0 = 0.5,
        z0 = 0.5

      const angle = Math.atan2(z - z0, x - x0)
      console.log([x, z], angle)
    }
  )

  return (
    <Fragment>
      <mesh ref={ref} position={[3, 0, 3]}>
        <boxBufferGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="tomato" />
      </mesh>
      <mesh
        name="dragPad"
        position={[-3, 0, -3]}
        rotation={[-PI / 2, 0, 0]}
        {...bind()}
      >
        <circleBufferGeometry args={[5]} />
        <meshBasicMaterial color="black" />
      </mesh>
    </Fragment>
  )
}

const IndexPage = () => {
  const { debug } = useGlobals()

  return (
    <Fragment>
      <DataInit>
        <AppInit>
          <Main />
        </AppInit>
      </DataInit>
    </Fragment>
  )
}

export default IndexPage
