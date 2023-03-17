import { TrpcProvider } from "../api/trpc/TrpcProvider"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <TrpcProvider>{children}</TrpcProvider>
}
