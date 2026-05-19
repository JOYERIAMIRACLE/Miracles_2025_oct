import type { Metadata } from "next"
import { ReactNode } from "react"
import { PersonalLayoutClient } from "@/components/Personal/PersonalLayoutClient"

export const metadata: Metadata = {
  title: { absolute: "Gestion" },
}

export default function GestionPersonalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dark flex min-h-screen bg-slate-950 text-slate-100">
      <PersonalLayoutClient>{children}</PersonalLayoutClient>
    </div>
  )
}
