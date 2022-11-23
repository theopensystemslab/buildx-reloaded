import DataInit from "@/data/DataInit"
import DefaultApp from "@/ui-3d/default/DefaultApp"
import AppInit from "@/ui-3d/init/AppInit"
import { MeshProps, ThreeElements, ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { forwardRef, Fragment, useRef } from "react"
import mergeRefs from "react-merge-refs"
import { Mesh } from "three"
import { proxy } from "valtio"
import { setCameraEnabled } from "../src/hooks/camera"
import { defaultDimensions, getInitialTransforms } from "../src/test/dimensions"
import {
  useHandleDragHandlers,
  useObjectDragHandlers,
} from "../src/test/handlers"
import houses, { useHouseKeys } from "../src/test/houses"
import transients from "../src/test/transients"
import CircularHandle from "../src/ui-3d/CircularHandle"
import { A, NEA, R } from "../src/utils/functions"
import { useSubscribeKey } from "../src/utils/hooks"
import { PI } from "../src/utils/math"

const modulesN = 2

const OFFSET = 1

type OurModuleProps = MeshProps & {
  houseKey: string
  index?: number
}

const OurModule = forwardRef<Mesh, OurModuleProps>(
  ({ index = 0, houseKey: houseName }, externalRef) => {
    const localRef = useRef<Mesh>()
    const initialTransforms = getInitialTransforms(index < modulesN - 1)

    useSubscribeKey(houses, houseName, () => {
      if (!localRef.current || !houses[houseName]) return

      const { position } = houses[houseName]

      localRef.current.scale.set(
        initialTransforms.scale.x,
        initialTransforms.scale.y,
        initialTransforms.scale.z
      )

      localRef.current.position.set(
        position.x + initialTransforms.position.x,
        position.y + initialTransforms.position.y,
        position.z + initialTransforms.position.z
      )
    })

    return (
      <mesh ref={mergeRefs([localRef, externalRef])}>
        <boxBufferGeometry
          args={[
            defaultDimensions.width,
            defaultDimensions.height,
            defaultDimensions.length,
          ]}
        />
        <meshBasicMaterial color="tomato" wireframe />
      </mesh>
    )
  }
)

const OurHouse = ({ houseKey }: { houseKey: string }) => {
  return (
    <Fragment>
      {NEA.range(0, modulesN).map((i) => (
        <OurModule key={`${houseKey}-${i}`} houseKey={houseKey} index={i} />
      ))}
    </Fragment>
  )
}

type RotateHandleProps = {
  houseKey: string
  right?: boolean
  front?: boolean
}

const RotateHandle = ({
  houseKey,
  right = false,
  front = false,
}: RotateHandleProps) => {
  const ref = useRef<Mesh>(null)
  useSubscribeKey(houses, houseKey, () => {
    if (!ref.current) return

    ref.current.rotation.set(PI / 2, 0, 0)

    if (right)
      ref.current.position.set(defaultDimensions.width / 2 + OFFSET, 0, 0)
    if (front)
      ref.current.position.set(
        0,
        0,
        (-(defaultDimensions.length + OFFSET) * modulesN) / 2
      )
  })
  useSubscribeKey(transients, houseKey, () => {})
  return <CircularHandle ref={ref} />
}

const Main = () => {
  const bindObjects = useObjectDragHandlers()
  const bindHandles = useHandleDragHandlers()
  const houseKeys = useHouseKeys()

  return (
    <Fragment>
      <group {...bindObjects()}>
        {pipe(
          houseKeys,
          A.map((k) => <OurHouse key={k} houseKey={k} />)
        )}
      </group>
      <group {...bindHandles()}>
        {pipe(
          houseKeys,
          A.map((k) => (
            <Fragment key={`rotationHandles-${k}`}>
              <RotateHandle houseKey={k} right />
              <RotateHandle houseKey={k} front />
            </Fragment>
          ))
        )}
      </group>
    </Fragment>
  )
}

const IndexPage = () => {
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
