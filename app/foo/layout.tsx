import React from "react"
import { TrpcProvider } from "../common/TrpcProvider"

const FooLayout = ({ children }: any) => {
  return <TrpcProvider>{children}</TrpcProvider>
}

export default FooLayout
