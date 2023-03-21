import { TrpcProvider } from "../common/TrpcProvider"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <TrpcProvider>{children}</TrpcProvider>
}
