import type { Metadata } from "next"
import { ReactNode } from "react"
import { EmpresaSidebar } from "@/components/Empresa/EmpresaSidebar"
import { EmpresaHeader } from "@/components/Empresa/EmpresaHeader"

export const metadata: Metadata = {
  title: { absolute: "Empresa" },
}

export default function GestionEmpresaLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dark flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 z-50 w-64">
        <EmpresaSidebar />
      </aside>
      <div className="md:pl-64 flex flex-col flex-1 min-w-0 w-full">
        <EmpresaHeader />
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
