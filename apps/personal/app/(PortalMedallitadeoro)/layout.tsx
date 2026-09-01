import type { ReactNode } from "react"
import type { Metadata } from "next"
import { AuthGuard } from "@/components/AuthGuard"

export const metadata: Metadata = {
  title: { absolute: "Portal Medalla de oro" },
}

export default function PortalMedalladeoroLayout({ children }: { children: ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>
}
