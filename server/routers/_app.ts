"use client"
import { elementsQuery } from "~/server/data/elements"
import {
  allHouseTypesQuery,
  systemHouseTypesQuery,
} from "~/server/data/houseType"
import { materialsQuery } from "~/server/data/materials"
import { modulesQuery } from "~/server/data/modules"
import { sectionTypesQuery } from "~/server/data/sectionTypes"
import { systemIdParser } from "~/server/data/system"
import Airtable from "airtable"
import { levelTypesQuery } from "~/server/data/levelTypes"
import { windowTypesQuery } from "~/server/data/windowTypes"
import { procedure, router } from "../trpc"
import { stairTypesQuery } from "~/server/data/stairTypes"

Airtable.configure({ apiKey: process.env.AIRTABLE_API_KEY })
const airtable = new Airtable()

export const appRouter = router({
  systemModules: procedure.input(systemIdParser).query(modulesQuery(airtable)),
  systemHouseTypes: procedure
    .input(systemIdParser)
    .query(systemHouseTypesQuery(airtable)),
  allHouseTypes: procedure.query(allHouseTypesQuery(airtable)),
  systemElements: procedure
    .input(systemIdParser)
    .query(elementsQuery(airtable)),
  systemMaterials: procedure
    .input(systemIdParser)
    .query(materialsQuery(airtable)),
  sectionTypes: procedure
    .input(systemIdParser)
    .query(sectionTypesQuery(airtable)),
  levelTypes: procedure.input(systemIdParser).query(levelTypesQuery(airtable)),
  windowTypes: procedure
    .input(systemIdParser)
    .query(windowTypesQuery(airtable)),
  stairTypes: procedure.input(systemIdParser).query(stairTypesQuery(airtable)),
})

// export type definition of API
export type AppRouter = typeof appRouter
