// utils/trpc.ts
import { createTRPCReact } from "@trpc/react-query"
import { AppRouter } from "../../app/api/trpc-2/[trpc]/route"

export const trpc = createTRPCReact<AppRouter>()
