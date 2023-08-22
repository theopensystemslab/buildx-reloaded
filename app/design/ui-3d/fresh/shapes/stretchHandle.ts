import { pipe } from "fp-ts/lib/function"
import { BoxGeometry, Group, Mesh, SphereGeometry } from "three"
import { A } from "../../../../utils/functions"
import handleMaterial from "../handleMaterial"
import { StretchHandleGroupUserData, UserDataTypeEnum } from "../scene/userData"

const OFFSET = 0.5
const sphereGeom = new SphereGeometry(0.5)
const boxGeom = new BoxGeometry(1, 1, 1)

const createStretchHandle = ({
  houseWidth,
  houseLength,
  axis,
  side,
}: {
  houseWidth: number
  houseLength: number
  axis: "z" | "x"
  side: 1 | -1
}) => {
  const boxMesh = new Mesh(boxGeom, handleMaterial)
  boxMesh.scale.setY(0.001)
  boxMesh.userData.type = UserDataTypeEnum.Enum.StretchHandleMesh

  const sphereMeshes = pipe(
    A.replicate(2, sphereGeom),
    A.mapWithIndex((i, geom): Mesh => {
      const mesh = new Mesh(geom, handleMaterial)
      mesh.scale.setY(0.001)
      mesh.userData.type = UserDataTypeEnum.Enum.StretchHandleMesh
      return mesh
    })
  )

  const handleGroup = new Group()

  handleGroup.add(boxMesh, ...sphereMeshes)

  if (axis === "z") {
    sphereMeshes.forEach((sphereMesh, i) => {
      const sign = i === 0 ? 1 : -1
      sphereMesh.position.setX((houseWidth / 2) * sign)
    })
    boxMesh.scale.setX(houseWidth)

    if (side === 1) {
      handleGroup.position.setZ(OFFSET * 1.75)
    } else if (side === -1) {
      handleGroup.position.setZ(-OFFSET)
    }
  } else if (axis === "x") {
    sphereMeshes.forEach((sphereMesh, i) => {
      const sign = i === 0 ? 1 : -1
      sphereMesh.position.setZ((houseLength / 2) * sign)
    })
    boxMesh.scale.setZ(houseLength)
    handleGroup.position.setX((side * houseWidth) / 2 + OFFSET * side)
    // handleGroup.position.setZ(houseLength / 2)
  }

  handleGroup.scale.setScalar(0.5)
  handleGroup.position.setY(0.01)

  const userData: StretchHandleGroupUserData = {
    axis,
    side,
    type: UserDataTypeEnum.Enum.StretchHandleGroup,
    updateXHandleLength: (nextLength: number) => {
      boxMesh.scale.setZ(nextLength)
      sphereMeshes.forEach((sphereMesh, i) => {
        const sign = i === 0 ? 1 : -1
        sphereMesh.position.setZ((nextLength / 2) * sign)
      })
    },
  }

  handleGroup.userData = userData

  return handleGroup
}

export default createStretchHandle
