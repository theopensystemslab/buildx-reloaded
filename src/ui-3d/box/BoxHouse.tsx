import { useColumnLayout } from "@/hooks/layouts"
import { useThree } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { useCallback, useMemo, useRef } from "react"
import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from "three"
import { setCameraEnabled } from "../../hooks/camera"
import houses from "../../hooks/houses"
import { useRotateVector } from "../../hooks/transforms"
import BoxColumn from "./BoxColumn"

type Props = {
  id: string
}

const BoxHouse = (props: Props) => {
  const groupRef = useRef<Group>(null!)
  const { id } = props
  const columns = useColumnLayout(id)

  const rotateVector = useRotateVector(id)

  const getBox2Points = useCallback(() => {
    if (columns.length < 1)
      return [
        [0, 0],
        [0, 0],
      ]
    const {
      position: [x, _, z],
    } = houses[id]
    const x0 = -columns[0].gridGroups[0].modules[0].module.width / 2
    const x1 = -x0
    const z0 = columns[0].gridGroups[0].modules[0].z
    const lastColumn = columns[columns.length - 1]
    const lastGridGroup =
      lastColumn.gridGroups[lastColumn.gridGroups.length - 1]
    const lastModule = lastGridGroup.modules[lastGridGroup.modules.length - 1]
    const z1 = lastColumn.z + lastModule.z + lastModule.module.length
    console.log(z1, z0)
    return [rotateVector([x0, z0]), rotateVector([x1, z1])]
  }, [columns, id, rotateVector])

  const scene = useThree((t) => t.scene)

  const boxMesh = useMemo(() => {
    const [[x0, z0], [x1, z1]] = getBox2Points()
    const geom = new BoxGeometry(x1 - x0, 100, z1 - z0)
    const material = new MeshBasicMaterial({ color: "blue", wireframe: true })
    const mesh = new Mesh(geom, material)
    mesh.rotation.y = houses[id].rotation
    mesh.position.z = (z1 - z0) / 2
    scene.add(mesh)
  }, [getBox2Points, id, scene])

  const bind = useGesture({
    onDrag: (state) => {
      const { first, last } = state
      if (first) setCameraEnabled(false)
      const { delta, direction } = state
      console.log(delta, direction)
      if (last) setCameraEnabled(true)
    },
  })

  // movestart, move, moveend
  // rotatestart, rotate, rotateend

  // useEffect subscribe to hard values

  // pre-calculated no-go area

  // on move end or init

  // maybe debounce it

  return (
    <group ref={groupRef} {...(bind() as any)}>
      {columns.map(({ columnIndex, z, gridGroups }) => {
        return (
          <BoxColumn
            key={columnIndex}
            houseId={id}
            columnIndex={columnIndex}
            columnZ={z}
            gridGroups={gridGroups}
            verticalCutPlanes={[]}
            mirror={columnIndex === columns.length - 1}
          />
        )
      })}
    </group>
  )
}

export default BoxHouse
