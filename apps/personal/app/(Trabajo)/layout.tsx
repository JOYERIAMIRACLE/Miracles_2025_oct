import type { Metadata } from "next"
import { ReactNode } from "react"
import { TrabajoLayoutClient } from "@/components/Trabajo/TrabajoLayoutClient"

export const metadata: Metadata = {
  title: { absolute: "Marketing team" },
}

export default function TrabajoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dark flex min-h-screen bg-slate-950 text-slate-100">
      <TrabajoLayoutClient>{children}</TrabajoLayoutClient>
    </div>
  )
}
