import { pipe } from "fp-ts/lib/function"
import { Fragment, useMemo } from "react"
import { MeshBasicMaterial } from "three"
import { Module } from "../../../../server/data/modules"
import { useGetDefaultElementMaterial } from "../../../design/state/hashedMaterials"
import { A, O, pipeLog } from "../../../utils/functions"
import useSpeckleObject from "../../../utils/speckle/useSpeckleObject"

function extractStreamId(urlString: string) {
  const url = new URL(urlString)
  const pathParts = url.pathname.split("/")
  // Assuming the URL is always in the format /streams/{streamId}/branches/{branchName}
  const streamIdIndex = pathParts.indexOf("streams") + 1
  return pathParts[streamIdIndex]
}

const DebugSpeckleModule = ({ module }: { module: Module }) => {
  const streamId = extractStreamId(module.speckleBranchUrl)
  // const gltf = useGLTF(module.modelUrl)
  const ifcGeometries = useSpeckleObject({
    streamId,
  })

  const getElementMaterial = useGetDefaultElementMaterial(module.systemId)

  const defaultMaterial = useMemo(() => new MeshBasicMaterial(), [])

  const meshes = pipe(
    ifcGeometries,
    A.mapWithIndex((i, { ifcTag, geometry }) => {
      const material = pipe(
        ifcTag,
        getElementMaterial,
        pipeLog,
        O.match(
          () => defaultMaterial,
          (x) => x.threeMaterial ?? defaultMaterial
        )
      )

      return <mesh key={i} {...{ geometry, material }} />
    })
  )

  return (
    <Fragment>
      <group>{meshes}</group>
      {/* <mesh position={[0, module.height / 2, -module.length / 2]}>
        <boxBufferGeometry
          args={[module.width, module.height, module.length]}
        />
        <meshBasicMaterial color="blue" wireframe />
      </mesh> */}
    </Fragment>
  )
}

export default DebugSpeckleModule
