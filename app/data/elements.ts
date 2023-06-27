import { trpc } from "@/client/trpc"
import { useLiveQuery } from "dexie-react-hooks"
import { pipe } from "fp-ts/lib/function"
import { useMemo } from "react"
import { BufferGeometry, BufferGeometryLoader } from "three"
import { O, R, RA, S } from "~/utils/functions"
import { Element } from "../../server/data/elements"
import { Module } from "../../server/data/modules"
import systemsDB from "../db/systems"
// import useSpeckleObject from "../utils/speckle/useSpeckleObject"

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

const useSpeckleObject = (speckleBranchUrl: string) => {
  const loader = useMemo(() => new BufferGeometryLoader(), [])

  const geometries = useLiveQuery(async () => {
    const model = await systemsDB.models.get(speckleBranchUrl)
    return model?.geometries
  })

  return useMemo(
    () =>
      pipe(
        geometries,
        R.map((x) => loader.parse(x) as BufferGeometry)
      ),
    [geometries, loader]
  )
}

export const useModuleElements = ({
  systemId,
  speckleBranchUrl,
}: Module): Record<string, BufferGeometry> => {
  const ifcTagToElement = useIfcTagToElement(systemId)
  const speckleObject = useSpeckleObject(speckleBranchUrl)

  return useMemo(
    () =>
      pipe(
        speckleObject,
        R.reduceWithIndex(S.Ord)({}, (ifcTag, acc, geometry) => {
          const el = ifcTagToElement(ifcTag)
          if (!el) return acc
          return {
            ...acc,
            [el.name]: geometry,
          }
        })
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [speckleBranchUrl, speckleObject]
  )
}
