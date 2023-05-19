import { TrpcProvider } from "~/ui/TrpcProvider"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <TrpcProvider>{children}</TrpcProvider>
}
