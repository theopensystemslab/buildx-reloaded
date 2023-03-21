import React from "react"
import { TrpcProvider } from "../api/trpc-2/TrpcProvider"

const FooLayout = ({ children }: any) => {
  return <TrpcProvider>{children}</TrpcProvider>
}

export default FooLayout
