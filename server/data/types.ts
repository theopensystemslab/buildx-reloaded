import type Airtable from "airtable"

export type QueryFn<T> = (
  airtable: Airtable
) => (arg: { input: { systemIds: string[] } }) => Promise<T[]>
