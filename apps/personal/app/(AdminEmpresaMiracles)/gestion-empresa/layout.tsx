import type { Metadata } from "next"
import { ReactNode } from "react"
import { EmpresaLayoutClient } from "@/components/Empresa/EmpresaLayoutClient"

export const metadata: Metadata = {
  title: { absolute: "Empresa" },
}

export default function GestionEmpresaLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dark flex min-h-screen bg-slate-950 text-slate-100">
      <EmpresaLayoutClient>{children}</EmpresaLayoutClient>
    </div>
  )
}
