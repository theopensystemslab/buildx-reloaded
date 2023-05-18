"use client"
import { pipe } from "fp-ts/lib/function"
import { useMemo, useRef } from "react"
import { Group, Material, MeshBasicMaterial } from "three"
import { Module } from "../../../../server/data/modules"
import { useModuleElements } from "../../../data/elements"
import { hashedGeometries } from "../../../design/state/hashedGeometries"
import { useGetDefaultElementMaterial } from "../../../design/state/hashedMaterials"
import { A, M, O, pipeLog, pipeLogWith, R, S } from "../../../utils/functions"
import useSpeckleObject from "../../../utils/speckle/useSpeckleObject"
import { calculateArea } from "../../../utils/three"
import DebugSpeckleElement from "./DebugSpeckleElement"

const DebugSpeckleModule2 = ({ module }: { module: Module }) => {
  const ifcGeometries = useSpeckleObject(module.speckleBranchUrl)

  const getElementMaterial = useGetDefaultElementMaterial(module.systemId)

  const defaultMaterial = useMemo(() => new MeshBasicMaterial(), [])

  const groupRef = useRef<Group>(null)

  const elements = useModuleElements(module)

  pipe(
    elements,
    M.filterMapWithIndex((elementName, geometryHash) =>
      pipe(hashedGeometries, R.lookup(geometryHash), O.map(calculateArea))
    ),
    pipeLog
  )

  return (
    <group ref={groupRef}>
      {pipe(
        elements,
        M.filterMapWithIndex((ifcTag, geometryHash) => {
          const material = pipe(
            ifcTag,
            getElementMaterial,
            O.match(
              (): Material => defaultMaterial,
              (x): Material => x.threeMaterial
            )
          )

          return pipe(
            hashedGeometries,
            R.lookup(geometryHash),
            O.map((geometry) => (
              <DebugSpeckleElement key={ifcTag} {...{ geometry, material }} />
            ))
          )
        })
      )}
    </group>
  )
}

export default DebugSpeckleModule2
