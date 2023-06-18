import { expose } from "comlink"
import * as pako from "pako"
import base64url from "base64url"
import { flow, pipe } from "fp-ts/lib/function"

// const compressEncode = async (payload: any) => {
//   const str = JSON.stringify(payload)
//   const uint8Array = new TextEncoder().encode(str)
//   const pakoCompressed = pako.deflate(uint8Array)
//   const buffer = Buffer.from(pakoCompressed.buffer)
//   const base64Encoded = base64url.encode(buffer)

//   return base64Encoded
// }

const textEncoder = new TextEncoder()

const compressEncode = flow(
  JSON.stringify,
  (s) => textEncoder.encode(s),
  (x) => Buffer.from(pako.deflate(x)),
  base64url.encode
)

const api = {
  compressEncode,
  // compressEncode2,
}

export type SharingWorkerAPI = typeof api

expose(api)
