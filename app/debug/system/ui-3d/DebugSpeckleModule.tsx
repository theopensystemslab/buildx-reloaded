"use client"
import { pipe } from "fp-ts/lib/function"
import { Fragment, useMemo } from "react"
import { MeshBasicMaterial } from "three"
import { Module } from "../../../../server/data/modules"
import { useGetDefaultElementMaterial } from "../../../design/state/hashedMaterials"
import { A, O } from "../../../utils/functions"
import useSpeckleObject from "../../../utils/speckle/useSpeckleObject"

const DebugSpeckleModule = ({ module }: { module: Module }) => {
  const ifcGeometries = useSpeckleObject(module.speckleBranchUrl)

  const getElementMaterial = useGetDefaultElementMaterial(module.systemId)

  const defaultMaterial = useMemo(() => new MeshBasicMaterial(), [])

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
