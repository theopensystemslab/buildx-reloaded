"use client"
import React, { useEffect, useRef } from "react"
import {
  AmbientLight,
  Clock,
  DirectionalLight,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  NotEqualStencilFunc,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  ReplaceStencilOp,
  Scene,
  ShadowMaterial,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
} from "three"
import { OrbitControls } from "three-stdlib"
import createPlaneStencilGroup from "../design/ui-3d/fresh/util/createPlaneStencilGroup"
const FooPage = () => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const clock = new Clock()

    const scene = new Scene()

    const camera = new PerspectiveCamera(
      36,
      window.innerWidth / window.innerHeight,
      1,
      100
    )
    camera.position.set(2, 2, 2)

    scene.add(new AmbientLight(0xffffff, 1.5))

    const dirLight = new DirectionalLight(0xffffff, 3)
    dirLight.position.set(5, 10, 7.5)
    dirLight.castShadow = true
    dirLight.shadow.camera.right = 2
    dirLight.shadow.camera.left = -2
    dirLight.shadow.camera.top = 2
    dirLight.shadow.camera.bottom = -2

    dirLight.shadow.mapSize.width = 1024
    dirLight.shadow.mapSize.height = 1024
    scene.add(dirLight)
    const planes = [new Plane(new Vector3(-1, 0, 0), 0)]

    const geometry = new TorusGeometry(0.4, 0.15, 220, 60)
    const object = new Group()
    scene.add(object)

    // Set up clip plane rendering
    const planeObjects: Mesh[] = []
    const planeGeom = new PlaneGeometry(4, 4)

    for (let i = 0; i < planes.length; i++) {
      const poGroup = new Group()
      const plane = planes[i]
      const stencilGroup = createPlaneStencilGroup(geometry, plane, i + 1)

      // plane is clipped by the other clipping planes
      const planeMat = new MeshStandardMaterial({
        color: 0xe91e63,
        metalness: 0.1,
        roughness: 0.75,
        clippingPlanes: planes.filter((p) => p !== plane),

        stencilWrite: true,
        stencilRef: 0,
        stencilFunc: NotEqualStencilFunc,
        stencilFail: ReplaceStencilOp,
        stencilZFail: ReplaceStencilOp,
        stencilZPass: ReplaceStencilOp,
      })
      const po = new Mesh(planeGeom, planeMat)
      po.onAfterRender = function (renderer) {
        renderer.clearStencil()
      }

      po.renderOrder = i + 1.1

      object.add(stencilGroup)
      poGroup.add(po)
      planeObjects.push(po)
      scene.add(poGroup)
    }

    const material = new MeshStandardMaterial({
      color: 0xffc107,
      metalness: 0.1,
      roughness: 0.75,
      clippingPlanes: planes,
      clipShadows: true,
      shadowSide: DoubleSide,
    })

    // add the color
    const clippedColorFront = new Mesh(geometry, material)
    clippedColorFront.castShadow = true
    clippedColorFront.renderOrder = 6
    object.add(clippedColorFront)

    const ground = new Mesh(
      new PlaneGeometry(9, 9, 1, 1),
      new ShadowMaterial({
        color: 0x000000,
        opacity: 0.25,
        side: DoubleSide,
      })
    )
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()

      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    const renderer = new WebGLRenderer({ antialias: true })
    renderer.shadowMap.enabled = true
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x263238)
    window.addEventListener("resize", onWindowResize)
    ref.current.appendChild(renderer.domElement)

    renderer.localClippingEnabled = true

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.minDistance = 2
    controls.maxDistance = 20
    controls.update()

    function animate() {
      requestAnimationFrame(animate)

      for (let i = 0; i < planeObjects.length; i++) {
        const plane = planes[i]
        const po = planeObjects[i]
        plane.coplanarPoint(po.position)
        po.lookAt(
          po.position.x - plane.normal.x,
          po.position.y - plane.normal.y,
          po.position.z - plane.normal.z
        )
      }

      renderer.render(scene, camera)
    }

    animate()
  }, [])
  return (
    <div
      ref={ref}
      className="w-full h-full absolute border-2 border-pink-500"
    />
  )
}

export default FooPage
