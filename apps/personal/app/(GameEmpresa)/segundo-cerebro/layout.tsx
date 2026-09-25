import type { Metadata } from "next"
import type { ReactNode } from "react"
import { AuthGuard } from "@/components/AuthGuard"

export const metadata: Metadata = {
  title: { absolute: "Segundo Cerebro" },
}

export default function SegundoCerebroLayout({ children }: { children: ReactNode }) {
  return <div className="dark"><AuthGuard>{children}</AuthGuard></div>
}
