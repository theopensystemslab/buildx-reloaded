import { TrpcProvider } from "../api/trpc-2/TrpcProvider"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <TrpcProvider>{children}</TrpcProvider>
}
