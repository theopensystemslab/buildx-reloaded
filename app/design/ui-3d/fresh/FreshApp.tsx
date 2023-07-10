import { useGesture } from "@use-gesture/react"
import { liveQuery } from "dexie"
import { pipe } from "fp-ts/lib/function"
import { memo, useEffect, useRef } from "react"
import { useKey } from "react-use"
import {
  BufferGeometry,
  BufferGeometryLoader,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
} from "three"
import { Module } from "../../../../server/data/modules"
import { ifcTagToElement } from "../../../data/elements"
import layoutsDB, { VanillaColumn } from "../../../db/layouts"
import systemsDB from "../../../db/systems"
import { R, S } from "../../../utils/functions"

// serialized layout key : column
let vanillaColumns: Record<string, VanillaColumn> = {}
liveQuery(() => layoutsDB.vanillaColumns.toArray()).subscribe(
  (dbVanillaColumns) => {
    for (let dbVanillaColumn of dbVanillaColumns) {
      const { layoutsKey, vanillaColumn } = dbVanillaColumn
      vanillaColumns[layoutsKey] = vanillaColumn
    }
  }
)

const loader = new BufferGeometryLoader()

// speckle branch url : geometry by ifc tag
let models: Record<string, Record<string, BufferGeometry>> = {}

liveQuery(async () => {
  const models = await layoutsDB.models.toArray()
  const elements = await systemsDB.elements.toArray()
  return { models, elements }
}).subscribe(({ models: dbModels, elements: dbElements }) => {
  for (let { speckleBranchUrl, geometries, systemId } of dbModels) {
    if (!(speckleBranchUrl in models)) {
      const loadedModels: Record<string, BufferGeometry> = pipe(
        geometries,
        R.map((x) => loader.parse(x) as BufferGeometry),
        R.reduceWithIndex(S.Ord)({}, (ifcTag, acc, geometry) => {
          const el = ifcTagToElement({
            systemId,
            elements: dbElements,
            ifcTag,
          })
          if (!el) return acc
          return {
            ...acc,
            [el.name]: geometry,
          }
        })
      )
      models[speckleBranchUrl] = loadedModels
    }
  }
})

const basicMaterial = new MeshBasicMaterial({ color: "tomato" })

const getGeometry = ({
  speckleBranchUrl,
  ifcTag,
}: {
  speckleBranchUrl: string
  ifcTag: string
}) => models[speckleBranchUrl][ifcTag]

const getMaterial = ({}: {
  systemId: string
  houseId: string
  elementName: string
}): Material => basicMaterial

const FreshApp = () => {
  const rootRef = useRef<Group>(null)

  // forget this for now, just useKey
  const bindAll = useGesture({
    onClick: console.log,
  }) as any

  const insert1VanillaColumn = () => {
    console.log("insert 1 vanilla")
  }

  const moduleToGroup = (module: Module) => {}

  const vanillaColumnToGroup = ({ gridGroups }: VanillaColumn): Group => {
    const columnGroup = new Group()

    gridGroups.forEach(({ modules, y }) => {
      modules.forEach(({ z, module: { dna, speckleBranchUrl } }) => {
        const moduleGroup = new Group()
        moduleGroup.position.set(0, y, z)
        const taggedModelGeometries = models[speckleBranchUrl]
        for (let ifcTag of Object.keys(taggedModelGeometries)) {
          const mesh = new Mesh(
            getGeometry({ speckleBranchUrl, ifcTag }),
            getMaterial({ systemId: "", houseId: "", elementName: "" })
          )
          moduleGroup.add(mesh)
        }
        columnGroup.add(moduleGroup)
      })
    })

    return columnGroup
  }

  const init = () => {
    if (!rootRef.current) return

    rootRef.current.clear()

    Object.values(vanillaColumns).forEach((vanillaColumn) => {
      rootRef.current!.add(vanillaColumnToGroup(vanillaColumn))
    })
  }

  useEffect(init, [])
  useKey("l", insert1VanillaColumn)

  return <group ref={rootRef} {...bindAll()}></group>
}

export default memo(FreshApp)
