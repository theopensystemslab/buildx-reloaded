import ObjectLoader from "@speckle/objectloader"
import { suspend } from "suspend-react"
import speckleIfcParser from "./speckleIfcParser"
import { request, gql } from "graphql-request"

// streamId: "3616f2f9fb",
// objectId: "9f798d821d7b9d1901828fe5880885b1",

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

const useSpeckleObject = ({ streamId }: { streamId: string }) => {
  const speckleObject: any = suspend(async () => {
    const data: any = await request("https://speckle.xyz/graphql", document, {
      streamId,
    })
    const objectId = data.stream.branch.commits.items[0].referencedObject

    console.log({ objectId })

    let loader = new ObjectLoader({
      serverUrl: "https://speckle.xyz",
      streamId,
      objectId,
    })

    return await loader.getAndConstructObject(() => {})
  }, [])

  return speckleIfcParser.parse(speckleObject)
}

export default useSpeckleObject
