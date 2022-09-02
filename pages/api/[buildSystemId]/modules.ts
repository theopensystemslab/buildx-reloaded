import Airtable from "airtable"
import type { NextApiRequest, NextApiResponse } from "next"
import { System } from "../../../src/data/system"
import config from "../../../buildx.config.yaml"
import * as z from "zod"
import { ErrorObject, serializeError } from "serialize-error"

Airtable.configure({ apiKey: process.env.AIRTABLE_API_KEY })

const systems: Array<System> = z
  .array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      airtableId: z.string().min(1),
    })
  )
  .parse(config.systems)

const airtable = new Airtable()

type Data = any
//  | {
//   name: string
// }

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<Data | ErrorObject>
) => {
  try {
    const { buildSystemId } = req.query
    if (typeof buildSystemId !== "string")
      throw new Error("buildSystemId not string")
    const buildSystem = systems.find((x) => x.id === buildSystemId)
    if (!buildSystem)
      throw new Error("buildSystemId invalid (not in buildx.config.yaml)")

    const foo = await airtable
      .base(buildSystem.airtableId)
      .table("modules")
      .select()
      .all()

    res.status(200).json({ foo })
  } catch (e) {
    const foo = serializeError(e)
    res.status(400).json({ error: serializeError(e) })
  }
}

export default handler
