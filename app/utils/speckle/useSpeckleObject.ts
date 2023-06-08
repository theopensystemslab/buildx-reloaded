"use client"
import CryptoJS from "crypto-js"
import Dexie from "dexie"
import { pipe } from "fp-ts/lib/function"
import { memo, useMemo } from "react"
import { suspend } from "suspend-react"
import { BufferGeometry, BufferGeometryLoader } from "three"
import { trpc } from "../../../client/trpc"
import { useModules } from "../../data/modules"
import { R } from "../functions"

// Define a TypeScript interface for the data stored in the database
interface GeometryRecord {
  speckleBranchUrl: string
  geometries: any
  timestamp: number
  hash: string
}

// Extend Dexie to create a database with the given structure
class SpeckleGeometryDatabase extends Dexie {
  geometries: Dexie.Table<GeometryRecord, string> // "string" is the type of the primary key

  constructor() {
    super("SpeckleGeometryDatabase")
    this.version(1).stores({
      geometries: "speckleBranchUrl,timestamp,hash",
    })
    this.geometries = this.table("geometries")
  }
}

// Create Dexie database
const db = new SpeckleGeometryDatabase()

// Extract the core logic to a new function
const useFetchGeometry = () => {
  const { speckleModel } = trpc.useContext()

  const fetchGeometry = async (
    speckleBranchUrl: string
  ): Promise<Record<string, any>> => {
    // Try to get geometry from IndexedDB
    const cachedJsonGeometries = await db.geometries.get(speckleBranchUrl)

    if (cachedJsonGeometries) {
      // Here you can add additional conditions to check if the cached data is still valid
      // e.g., compare the current timestamp with the cached timestamp and decide if you need to fetch new data
      return cachedJsonGeometries.geometries
    } else {
      // If not found in IndexedDB, fetch from server
      // Replace the following line with your data fetching logic

      const ifcJsonGeometries = await speckleModel.fetch({
        speckleBranchUrl,
      })

      // Hash the geometries
      const geometriesHash = CryptoJS.MD5(
        JSON.stringify(ifcJsonGeometries)
      ).toString()

      // Cache the result in IndexedDB along with the current timestamp and hash
      await db.geometries.put({
        speckleBranchUrl,
        geometries: ifcJsonGeometries,
        timestamp: new Date().getTime(),
        hash: geometriesHash,
      })

      return ifcJsonGeometries
    }
  }

  return fetchGeometry
}

const useSpeckleObject = (
  speckleBranchUrl: string
): Record<string, BufferGeometry> => {
  const fetchGeometry = useFetchGeometry()
  const ifcJsonGeometries = suspend(fetchGeometry, [speckleBranchUrl], {
    lifespan: 3600000,
  }) // cache for 1 hour

  const loader = useMemo(() => new BufferGeometryLoader(), [])

  return useMemo(
    () =>
      pipe(
        ifcJsonGeometries,
        R.map((x) => loader.parse(x) as BufferGeometry)
      ),
    [ifcJsonGeometries, loader]
  )
}

export const useSpeckleObjects = (
  speckleBranchUrls: string[]
): Record<string, BufferGeometry>[] => {
  const fetchGeometry = useFetchGeometry()

  // Use suspend-react to fetch the geometries
  const geometries = speckleBranchUrls.map((url) => {
    return suspend(fetchGeometry, [url], { lifespan: 3600000 }) // cache for 1 hour
  })

  const loader = useMemo(() => new BufferGeometryLoader(), [])

  // Transform the JSON geometries into BufferGeometry objects
  return geometries.map((geometry, i) => {
    const bufferGeometries: Record<string, BufferGeometry> = {}
    for (const key in geometry) {
      bufferGeometries[key] = loader.parse(geometry[key]) as BufferGeometry
    }
    return bufferGeometries
  })
}

export const PreloadSpeckleObjects = memo(() => {
  const modules = useModules()

  const speckleBranchUrls = useMemo(
    () => modules.map((module) => module.speckleBranchUrl),
    [modules]
  )

  useSpeckleObjects(speckleBranchUrls)
  return null
})

export default useSpeckleObject
