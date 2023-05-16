import ObjectLoader from "@speckle/objectloader"
import { gql, request } from "graphql-request"
import { suspend } from "suspend-react"
import speckleIfcParser from "./speckleIfcParser"

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
  // Assuming the URL is always in the format /streams/{streamId}/branches/{branchName}
  const streamIdIndex = pathParts.indexOf("streams") + 1
  return pathParts[streamIdIndex]
}

const useSpeckleObject = (speckleBranchUrl: string) => {
  const streamId = extractStreamId(speckleBranchUrl)

  const speckleObject: any = suspend(async () => {
    const data: any = await request("https://speckle.xyz/graphql", document, {
      streamId,
    })

    const objectId = data.stream.branch.commits.items[0].referencedObject

    let loader = new ObjectLoader({
      serverUrl: "https://speckle.xyz",
      streamId,
      objectId,
      // options: {
      //   enableCaching: true,
      //   excludeProps: true
      // },
    })

    return await loader.getAndConstructObject(() => {})
  }, [streamId])

  return speckleIfcParser.parse(speckleObject)
}

useSpeckleObject.preload = (speckleBranchUrl: string) => {
  const streamId = extractStreamId(speckleBranchUrl)

  request("https://speckle.xyz/graphql", document, {
    streamId,
  }).then((data: any) => {
    const objectId = data.stream.branch.commits.items[0].referencedObject

    let loader = new ObjectLoader({
      serverUrl: "https://speckle.xyz",
      streamId,
      objectId,
      options: { enableCaching: true },
    })

    loader.getAndConstructObject(() => {})
  })
}

export default useSpeckleObject
