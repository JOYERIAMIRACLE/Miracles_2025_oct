import type { Metadata } from "next"
import { ReactNode } from "react"
import { PersonalSidebar } from "@/components/Personal/PersonalSidebar"
import { PersonalHeader } from "@/components/Personal/PersonalHeader"

export const metadata: Metadata = {
  title: "Personal",
  description: "Gestión personal: finanzas, hábitos y seguimiento.",
}

export default function GestionPersonalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dark flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 z-50 w-64">
        <PersonalSidebar />
      </aside>
      <div className="md:pl-64 flex flex-col flex-1 min-w-0 w-full">
        <PersonalHeader />
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
