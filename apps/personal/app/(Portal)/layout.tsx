import type { Metadata } from "next"
import { ReactNode } from "react"
import { AuthGuard } from "@/components/AuthGuard"

export const metadata: Metadata = {
  title: { template: "%s", default: "Portal SDI" },
}

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0b1426]">
        {children}
      </div>
    </AuthGuard>
  )
}
