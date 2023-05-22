"use client"
import { pipe } from "fp-ts/lib/function"
import { useMemo, useRef } from "react"
import { Group, Material, MeshBasicMaterial } from "three"
import { Module } from "../../../../server/data/modules"
import { useGetDefaultElementMaterial } from "../../../design/state/hashedMaterials"
import { O, R, S } from "../../../utils/functions"
import useSpeckleObject from "../../../utils/speckle/useSpeckleObject"
import DebugSpeckleElement from "./DebugSpeckleElement"

const DebugSpeckleModule = ({ module }: { module: Module }) => {
  // const ifcGeometries = useSpeckleObject(module.speckleBranchUrl)

  const ifcGeometries = useSpeckleObject(module.speckleBranchUrl)

  const getElementMaterial = useGetDefaultElementMaterial(module.systemId)

  const defaultMaterial = useMemo(() => new MeshBasicMaterial(), [])

  const groupRef = useRef<Group>(null)

  return (
    <group ref={groupRef}>
      {pipe(
        ifcGeometries,
        // A.takeLeft(1),
        R.collect(S.Ord)((ifcTag, geometry) => {
          const material = pipe(
            ifcTag,
            getElementMaterial,
            O.match(
              (): Material => defaultMaterial,
              (x): Material => x.threeMaterial
            )
          )

          return (
            <DebugSpeckleElement key={ifcTag} {...{ geometry, material }} />
          )
        })
      )}
    </group>
  )
}

export default DebugSpeckleModule
