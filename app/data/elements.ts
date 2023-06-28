import { trpc } from "@/client/trpc"
import { liveQuery } from "dexie"
import { pipe } from "fp-ts/lib/function"
import { useMemo } from "react"
import { BufferGeometry, BufferGeometryLoader } from "three"
import { proxy, ref, useSnapshot } from "valtio"
import { O, R, RA, S } from "~/utils/functions"
import { Element } from "../../server/data/elements"
import { Module } from "../../server/data/modules"
import layoutsDB from "../db/layouts"
import systemsDB from "../db/systems"
import { isSSR } from "../utils/next"

export const useElements = (): Element[] => {
  const { data = [] } = trpc.elements.useQuery()
  return data
}

export const useSystemElements = ({
  systemId,
}: {
  systemId: string
}): Element[] => {
  return useElements().filter((x) => x.systemId === systemId)
}

export const ifcTagToElement = ({
  systemId,
  elements,
  ifcTag,
}: {
  elements: Element[]
  ifcTag: string
  systemId: string
}) => {
  const result = pipe(
    elements,
    RA.findFirst((el) => {
      return (
        el.ifc4Variable.toUpperCase() === ifcTag && el.systemId === systemId
      )
    }),
    O.toUndefined
  )

  if (result === undefined) {
    console.log({
      unmatchedIfcTag: { ifcTag },
    })
  }

  return result
}

export const useIfcTagToElement = (systemId: string) => {
  const elements = useSystemElements({ systemId })

  return (ifcTag: string) => {
    const result = pipe(
      elements,
      RA.findFirst((el) => {
        return el.ifc4Variable.toUpperCase() === ifcTag
      }),
      O.toUndefined
    )

    if (result === undefined) {
      console.log({
        unmatchedIfcTag: { ifcTag },
      })
    }

    return result
  }
}

export const getModuleElementGeometriesKey = ({
  systemId,
  dna,
}: {
  systemId: string
  dna: string
}) => `${systemId}:${dna}`

export const invertModuleElementGeometriesKey = (input: string) => {
  const [systemId, dna] = input.split(":")
  return { systemId, dna }
}

const models = proxy<Record<string, Record<string, BufferGeometry>>>({})

const loader = new BufferGeometryLoader()

if (!isSSR()) {
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
        models[speckleBranchUrl] = ref(loadedModels)
      }
    }
  })
}

export const useSpeckleObject = (speckleBranchUrl: string) => {
  const snap = useSnapshot(models) as typeof models

  return snap[speckleBranchUrl]
}

export const useModuleElements = ({
  systemId,
  speckleBranchUrl,
}: Module): Record<string, BufferGeometry> => {
  const speckleObject = useSpeckleObject(speckleBranchUrl)

  return useMemo(
    () => pipe(speckleObject),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [speckleBranchUrl, speckleObject]
  )
}
