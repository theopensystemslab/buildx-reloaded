"use client"
import { useHelper } from "@react-three/drei"
import { pipe } from "fp-ts/lib/function"
import { Fragment, useMemo, useRef } from "react"
import { Group, Material, MeshBasicMaterial } from "three"
import { VertexNormalsHelper } from "three-stdlib"
import { Module } from "../../../../server/data/modules"
import { useGetDefaultElementMaterial } from "../../../design/state/hashedMaterials"
import { A, O, pipeLog, pipeLogWith } from "../../../utils/functions"
import useSpeckleObject from "../../../utils/speckle/useSpeckleObject"
import DebugSpeckleElement from "./DebugSpeckleElement"

const DebugSpeckleModule = ({ module }: { module: Module }) => {
  const ifcGeometries = useSpeckleObject(module.speckleBranchUrl)

  const getElementMaterial = useGetDefaultElementMaterial(module.systemId)

  const defaultMaterial = useMemo(() => new MeshBasicMaterial(), [])

  const groupRef = useRef<Group>(null)

  return (
    <group ref={groupRef}>
      {pipe(
        ifcGeometries,
        // A.takeLeft(1),
        A.mapWithIndex((i, { ifcTag, geometry }) => {
          const material = pipe(
            ifcTag,
            getElementMaterial,
            O.match(
              (): Material => defaultMaterial,
              (x): Material => x.threeMaterial
            ),
            pipeLogWith((material) => [ifcTag, material])
          )

          return <DebugSpeckleElement key={i} {...{ geometry, material }} />
        })
      )}
    </group>
  )
}

export default DebugSpeckleModule
