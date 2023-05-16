import { pipe } from "fp-ts/lib/function"
import { Fragment, useMemo } from "react"
import { MeshBasicMaterial } from "three"
import { Module } from "../../../../server/data/modules"
import {
  useGetDefaultElementMaterial,
  useGetElementMaterial,
} from "../../../design/state/hashedMaterials"
import { A, O } from "../../../utils/functions"
import useSpeckleObject from "../../../utils/speckle/useSpeckleObject"

// const streamId = "3616f2f9fb"
const streamId = "ba796865f8"
const objectId = "9f798d821d7b9d1901828fe5880885b1"
// https://speckle.xyz/streams/ba796865f8/branches/main

function extractStreamId(urlString: string) {
  const url = new URL(urlString)
  const pathParts = url.pathname.split("/")
  // Assuming the URL is always in the format /streams/{streamId}/branches/{branchName}
  const streamIdIndex = pathParts.indexOf("streams") + 1
  return pathParts[streamIdIndex]
}

const DebugSpeckleModule = ({ module }: { module: Module }) => {
  // const gltf = useGLTF(module.modelUrl)
  const ifcGeometries = useSpeckleObject({
    streamId: extractStreamId(module.speckleBranchUrl),
  })

  const getElementMaterial = useGetDefaultElementMaterial(module.systemId)

  const defaultMaterial = useMemo(
    () => new MeshBasicMaterial({ transparent: true, opacity: 0 }),
    []
  )

  const meshes = pipe(
    ifcGeometries,
    A.mapWithIndex((i, { ifcTag, geometry }) => {
      const material = pipe(
        ifcTag,
        getElementMaterial,
        O.match(
          () => defaultMaterial,
          (x) => x.threeMaterial ?? defaultMaterial
        )
      )
      // getElementMaterial(ifcTag)?.threeMaterial ?? defaultMaterial

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
