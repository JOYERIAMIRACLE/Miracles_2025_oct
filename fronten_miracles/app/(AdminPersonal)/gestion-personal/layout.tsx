import { ReactNode } from "react"
import { PersonalSidebar } from "@/components/Personal/PersonalSidebar"
import { PersonalHeader } from "@/components/Personal/PersonalHeader"

export default function GestionPersonalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-50/50 dark:bg-zinc-950/50">
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 z-50 w-64 border-r bg-background">
        <PersonalSidebar />
      </aside>
      <div className="md:pl-64 flex flex-col flex-1 min-w-0">
        <PersonalHeader />
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
