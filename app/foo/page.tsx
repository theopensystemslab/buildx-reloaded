"use client"
import { pipe } from "fp-ts/lib/function"
import { useEffect, useRef } from "react"
import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  BufferGeometryLoader,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShadowMaterial,
  SphereGeometry,
  WebGLRenderer,
} from "three"
import {
  ADDITION,
  Brush,
  Evaluator,
  INTERSECTION,
  SUBTRACTION,
} from "three-bvh-csg"
import { OrbitControls } from "three-stdlib"
import layoutsDB, { IndexedModel, PositionedRow } from "../db/layouts"
import { A, errorThrower, O, R, someOrError } from "../utils/functions"

const loader = new BufferGeometryLoader()

const getFirstGeoms = async () => {
  const allModels = await layoutsDB.models.toArray()
  return pipe(
    allModels,
    A.lookup(2),
    O.map(({ geometries }) =>
      pipe(
        Object.values(geometries),
        // A.takeLeft(3),
        A.map(
          (geometryData: any) => loader.parse(geometryData) as BufferGeometry
        )
      )
    ),
    someOrError("yo")
  )
}

const getColumn = async () => {
  const vanillaColumns = await layoutsDB.vanillaColumns.toArray()

  return await pipe(
    vanillaColumns,
    A.head,
    O.map(({ vanillaColumn: { gridGroups } }) =>
      pipe(
        gridGroups,
        A.map(
          async ({
            y,
            modules: [
              {
                module: { speckleBranchUrl },
              },
            ],
          }): Promise<[number, Record<string, BufferGeometry>]> => {
            const indexedModel = await layoutsDB.models.get(speckleBranchUrl)
            if (!indexedModel) throw new Error("no indexed model")

            // key is an IFC tag
            const geometries: Record<string, BufferGeometry> = pipe(
              indexedModel.geometries,
              R.map((json) => {
                return loader.parse(json)
              })
            )

            // foo.geometries is like
            // a record of <ifcTag, json>
            // so we need to load (parse) the json (with the BufferGeometryLoader)
            // into a BufferGeometry
            // ---
            // we also need to apply the transform (y) to the geometry
            // prior to merging all of the geometries per ifc Tag
            return [y, geometries]
          }
        ),
        (xs) => Promise.all(xs)
      )
    ),
    someOrError("yo")
  )
}

const init = (el: HTMLDivElement) => {
  const bgColor = 0x111111

  // renderer setup
  const renderer = new WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(bgColor, 1)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFSoftShadowMap
  el.appendChild(renderer.domElement)

  // scene setup
  const scene = new Scene()

  // lights
  const light = new DirectionalLight(0xffffff, 1)
  light.position.set(1, 2, 1)
  scene.add(light, new AmbientLight(0xb0bec5, 0.1))

  // shadows
  const shadowCam = light.shadow.camera
  light.castShadow = true
  light.shadow.mapSize.setScalar(4096)
  light.shadow.bias = 1e-5
  light.shadow.normalBias = 1e-2

  shadowCam.left = shadowCam.bottom = -2.5
  shadowCam.right = shadowCam.top = 2.5
  shadowCam.updateProjectionMatrix()

  // camera setup
  const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    50
  )
  camera.position.set(-2, 1.5, 2)
  camera.far = 100
  camera.updateProjectionMatrix()

  // controls
  const controls = new OrbitControls(camera, renderer.domElement)

  // floor
  const floor = new Mesh(
    new PlaneGeometry(),
    new ShadowMaterial({ opacity: 0.05 })
  )
  floor.material.color.set(0xe0f7fa)
  floor.rotation.x = -Math.PI / 2
  floor.scale.setScalar(10)
  floor.position.y = -0.75
  floor.receiveShadow = true
  scene.add(floor)

  // materials
  const redMaterial = new MeshStandardMaterial({
    roughness: 0.25,
    side: DoubleSide,
  })
  const greenMaterial = new MeshStandardMaterial({
    roughness: 0.25,
    side: DoubleSide,
  })
  const blueMaterial = new MeshStandardMaterial({
    roughness: 0.25,
    side: DoubleSide,
  })

  redMaterial.color.set(0xff1744)
  greenMaterial.color.set(0x76ff03)
  blueMaterial.color.set(0x2979ff)

  const materials = [redMaterial, greenMaterial, blueMaterial]

  getFirstGeoms().then((geoms) => {
    return
    // const pieces = geoms.map((geom, index) => {
    //   const piece = new Brush(geom, materials[index % materials.length])
    //   piece.castShadow = true
    //   piece.updateMatrixWorld()
    //   return piece
    // })

    const somePiece = new Brush(geoms[0], greenMaterial)
    somePiece.updateMatrixWorld()
    // scene.add(somePiece)
    console.log(somePiece)

    const subtractor = new Brush(new SphereGeometry(1, 50, 50), greenMaterial)
    subtractor.updateMatrixWorld()

    const evaluator = new Evaluator()
    const result = evaluator.evaluate(somePiece, subtractor, SUBTRACTION)
    scene.add(result)
  })

  getColumn().then((column) => {
    const brushes = pipe(
      column,
      A.chain(([y, geomsByIfcTag]) =>
        pipe(
          Object.values(geomsByIfcTag),
          A.map((geom) => {
            if (y !== 0) {
              geom.translate(0, y, 0)
            }
            return new Brush(geom, greenMaterial)
          })
        )
      )
    )

    const delta = 0.1
    const intersector = new Brush(new BoxGeometry(10, 10, delta), blueMaterial)
    intersector.translateZ(-delta)

    const evaluator = new Evaluator()

    brushes.forEach((brush) => {
      // scene.add(brush)
      const result = evaluator.evaluate(intersector, brush, INTERSECTION)
      console.log(result)
      result.material = redMaterial
      scene.add(result)
    })

    // scene.add(intersector)
  })

  // // basic pieces
  // const cylinder1 = new Brush(
  //   new CylinderGeometry(0.5, 0.5, 6, 45),
  //   blueMaterial
  // )
  // cylinder1.updateMatrixWorld()

  // const cylinder2 = new Brush(
  //   new CylinderGeometry(0.5, 0.5, 6, 45),
  //   blueMaterial
  // )
  // cylinder2.rotation.x = Math.PI / 2
  // cylinder2.updateMatrixWorld()

  // const cylinder3 = new Brush(
  //   new CylinderGeometry(0.5, 0.5, 6, 45),
  //   blueMaterial
  // )
  // cylinder3.rotation.z = Math.PI / 2
  // cylinder3.updateMatrixWorld()

  // const sphere = new Brush(new SphereGeometry(1, 50, 50), greenMaterial)
  // sphere.updateMatrixWorld()

  // const box = new Brush(new BoxGeometry(1.5, 1.5, 1.5), redMaterial)
  // box.updateMatrixWorld()

  // processing
  // const evaluator = new Evaluator()
  // let result
  // result = evaluator.evaluate(cylinder1, cylinder2, ADDITION)
  // result = evaluator.evaluate(result, cylinder3, ADDITION)
  // result = evaluator.evaluate(sphere, result, SUBTRACTION)
  // result = evaluator.evaluate(box, result, INTERSECTION)

  // result.castShadow = true
  // result.receiveShadow = true
  // scene.add(result)

  window.addEventListener(
    "resize",
    function () {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()

      renderer.setSize(window.innerWidth, window.innerHeight)
    },
    false
  )

  const go = () => {
    requestAnimationFrame(go)
    renderer.render(scene, camera)
  }

  go()
}

const getCleanUp = (el: HTMLDivElement) => {
  return () => {
    el.innerHTML = ""
  }
}

const FooPage = () => {
  const divRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!divRef.current) return
    init(divRef.current)
    return getCleanUp(divRef.current)
  }, [])
  return <div ref={divRef} className="absolute  w-full h-full" />
}

export default FooPage
