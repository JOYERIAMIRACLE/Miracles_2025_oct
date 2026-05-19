"use client"

import { PersonalSidebar } from "./PersonalSidebar"
import { PersonalHeader } from "./PersonalHeader"
import { AuthGuard } from "@/components/AuthGuard"

export function PersonalLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 z-50 w-64">
        <PersonalSidebar />
      </aside>
      <div className="md:pl-64 flex flex-col flex-1 min-w-0 w-full">
        <PersonalHeader />
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}
