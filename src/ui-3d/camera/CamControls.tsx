import {
  EventManager,
  extend,
  ReactThreeFiber,
  useFrame,
  useThree,
} from "@react-three/fiber"
import CameraControls from "camera-controls"
import { pipe } from "fp-ts/lib/function"
import { mapWithIndex } from "fp-ts/lib/Record"
import * as React from "react"
import * as THREE from "three"
import { Event, OrthographicCamera, PerspectiveCamera } from "three"
import { CameraLayer } from "@/constants"

CameraControls.install({ THREE })
extend({ CameraControls })

export type CamControlsProps = ReactThreeFiber.Overwrite<
  ReactThreeFiber.Object3DNode<CameraControls, typeof CameraControls>,
  {
    target?: ReactThreeFiber.Vector3
    camera?: THREE.Camera
    domElement?: HTMLElement
    regress?: boolean
    setControls?: (controls: CameraControls) => void
    onUpdate?: (self?: THREE.Event) => void
    onControlStart?: (e?: THREE.Event) => void
    onControl?: (e?: THREE.Event) => void
    onControlEnd?: (e?: THREE.Event) => void
    onTransitionStart?: (e?: THREE.Event) => void
    onWake?: (e?: THREE.Event) => void
    onRest?: (e?: THREE.Event) => void
    onSleep?: (e?: THREE.Event) => void
  }
>

export const CamControls = React.forwardRef<CameraControls, CamControlsProps>(
  (
    {
      camera,
      regress,
      domElement,
      setControls,
      onControlStart,
      onControl,
      onControlEnd,
      onUpdate,
      onTransitionStart,
      onWake,
      onRest,
      onSleep,
      ...restProps
    },
    ref
  ) => {
    const invalidate = useThree(({ invalidate }) => invalidate)
    const defaultCamera = useThree(({ camera }) => camera)
    const gl = useThree(({ gl }) => gl)
    const events = useThree(({ events }) => events) as EventManager<HTMLElement>
    const performance = useThree(({ performance }) => performance)
    const explCamera = (camera ?? defaultCamera) as
      | PerspectiveCamera
      | OrthographicCamera
    const explDomElement = domElement ?? events.connected ?? gl.domElement
    if (!explDomElement) throw new Error("explDomElement undefined")
    const controls = React.useMemo(
      () => new CameraControls(explCamera, explDomElement),
      [explCamera, explDomElement]
    )

    React.useEffect(() => {
      explCamera.updateProjectionMatrix()
      explCamera.layers.disableAll()
      explCamera.layers.enable(CameraLayer.VISIBLE)
      // explCamera.layers.disable(CameraLayer.INVISIBLE)
      // explCamera.layers.enable(EffectsLayer.bloom)
      // explCamera.layers.enable(EffectsLayer.outline)
    }, [explCamera])

    useFrame((_, delta) => {
      if (controls.enabled) controls.update(Math.min(0.016, delta))
    })

    React.useEffect(() => {
      const eventsMap = {
        update: onUpdate,
        controlstart: onControlStart,
        controlend: onControlEnd,
        control: onControl,
        transitionstart: onTransitionStart,
        wake: onWake,
        rest: onRest,
        sleep: onSleep,
      }

      const unsubs = pipe(
        eventsMap,
        mapWithIndex((eventName, handler) => {
          const f = (event: Event) => {
            invalidate()
            if (regress) performance.regress()
            if (handler) handler(event)
          }
          controls.addEventListener(eventName, f)
          return () =>
            void (handler && controls.removeEventListener(eventName, f))
        })
      )

      return () => {
        Object.values(unsubs).forEach((unsub) => unsub())
        controls.dispose()
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [explDomElement, regress, controls, invalidate])

    React.useEffect(() => {
      if (setControls) {
        setControls(controls)
      }
    }, [setControls, controls])

    return <primitive ref={ref} object={controls} {...restProps} />
  }
)
