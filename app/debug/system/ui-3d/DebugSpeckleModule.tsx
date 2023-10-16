"use client"
import { pipe } from "fp-ts/lib/function"
import { useMemo, useRef } from "react"
import { Group, Material, MeshBasicMaterial } from "three"
import { Module } from "../../../../server/data/modules"
import { useSpeckleObject } from "../../../data/elements"
// import { useGetDefaultElementMaterial } from "../../../design/state/hashedMaterials"
import { useGetDefaultElementMaterial } from "../../../design/ui-3d/fresh/systems"
import { O, R, S } from "../../../utils/functions"
import DebugSpeckleElement from "./DebugSpeckleElement"

const DebugSpeckleModule = ({ module }: { module: Module }) => {
  // const ifcGeometries = useSpeckleObject(module.speckleBranchUrl)

  const ifcGeometries = useSpeckleObject(module.speckleBranchUrl)

  const getElementMaterial = useGetDefaultElementMaterial()

  const defaultMaterial = useMemo(() => new MeshBasicMaterial(), [])

  const groupRef = useRef<Group>(null)

  return (
    <group ref={groupRef}>
      {pipe(
        ifcGeometries,
        O.getOrElse(() => ({})),
        // A.takeLeft(1),
        R.collect(S.Ord)((ifcTag, geometry) => {
          const material = pipe(
            getElementMaterial({ systemId: module.systemId, ifcTag }),
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
