import ObjectLoader from "@speckle/objectloader"
import { pipe } from "fp-ts/lib/function"
import { gql, request } from "graphql-request"
import produce from "immer"
import { BufferGeometry } from "three"
import { mergeBufferGeometries } from "three-stdlib"
import { z } from "zod"
import { A, R } from "~/utils/functions"
import speckleIfcParser from "../../app/utils/speckle/speckleIfcParser"

export const speckleModelQueryInputParser = z.object({
  speckleBranchUrl: z.string().min(1),
})

type SpeckleModelQueryInput = z.infer<typeof speckleModelQueryInputParser>

const document = gql`
  query Stream($streamId: String!) {
    stream(id: $streamId) {
      branch(name: "main") {
        commits(limit: 1) {
          totalCount
          items {
            referencedObject
          }
        }
      }
    }
  }
`

const extractStreamId = (urlString: string) => {
  const url = new URL(urlString)
  const pathParts = url.pathname.split("/")
  const streamIdIndex = pathParts.indexOf("streams") + 1
  return pathParts[streamIdIndex]
}

const getSpeckleObject = async (speckleBranchUrl: string) => {
  const streamId = extractStreamId(speckleBranchUrl)

  const data: any = await request("https://speckle.xyz/graphql", document, {
    streamId,
  })

  const objectId = data.stream.branch.commits.items[0].referencedObject

  let loader = new ObjectLoader({
    serverUrl: "https://speckle.xyz",
    streamId,
    objectId,
    options: {
      enableCaching: false,
      excludeProps: [],
      customLogger: undefined,
      customWarner: undefined,
      fullyTraverseArrays: undefined,
    },
  })

  return await loader.getAndConstructObject(() => {})
}

export const speckleModelQuery = async ({
  input: { speckleBranchUrl },
}: {
  input: SpeckleModelQueryInput
}) => {
  const data = await getSpeckleObject(speckleBranchUrl)
  const speckleObject = speckleIfcParser.parse(data)

  return pipe(
    speckleObject,
    A.reduce(
      {},
      (acc: { [e: string]: BufferGeometry[] }, { ifcTag, geometry }) => {
        return produce(acc, (draft) => {
          if (ifcTag in draft) draft[ifcTag].push(geometry)
          else draft[ifcTag] = [geometry]
        })
      }
    ),
    R.map((geoms) => mergeBufferGeometries(geoms)),
    R.filter((bg: BufferGeometry | null): bg is BufferGeometry => Boolean(bg)),
    R.map((x) => x.toJSON())
  )
}
