import { TRPCContext } from "@trpc/react-query/shared"
import Airtable from "airtable"
import { expose } from "comlink"
import Dexie from "dexie"
import { trpc, vanillaTrpc } from "../../../client/trpc"
import { Block, blocksQuery } from "../../../server/data/blocks"

console.log("HI IM A WORKER")

class SystemsDatabase extends Dexie {
  blocks: Dexie.Table<Block, string> // "string" is the type of the primary key

  constructor() {
    super("SystemsDatabase")
    this.version(1).stores({
      blocks: "id,systemId,name",
    })
    this.blocks = this.table("blocks")
  }
}

// Create Dexie database
const db = new SystemsDatabase()

const init = async () => {
  const blocks = await vanillaTrpc.blocks.query()
  console.log(blocks)
}

init()

const getBlocks = async (systemIds: string[] = []) => {
  console.log("getBlocks")
  if (systemIds.length === 0) {
    return []
  } else {
    return db.blocks.toArray()
  }
}

const api = {
  getBlocks,
}

export type SystemsAPI = typeof api

expose(api)
