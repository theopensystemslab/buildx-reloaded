import { trpc } from "@/client/trpc"
import { pipe } from "fp-ts/lib/function"
import produce from "immer"
import { useCallback, useMemo } from "react"
import { BufferGeometry } from "three"
import { mergeBufferGeometries } from "three-stdlib"
import { proxy } from "valtio"
import { hashGeometry } from "~/design/state/hashedGeometries"
import { O, pipeLog, R, RA, RR, S } from "~/utils/functions"
import { Element } from "../../server/data/elements"
import { Module } from "../../server/data/modules"
import useSpeckleObject from "../utils/speckle/useSpeckleObject"

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

const useIfcTagToElement = (systemId: string) => {
  const elements = useSystemElements({ systemId })

  return useCallback(
    (ifcTag: string) => {
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
    },
    [elements]
  )
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
    [speckleBranchUrl]
  )
}
