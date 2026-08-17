"use client"

import { BookOpen, LifeBuoy, Users } from "lucide-react"
import { useSectionTab, TabBar, PageHeader, Pending } from "./shared"

const TABS = [
  { id: "politicas",  label: "Políticas",       icon: BookOpen },
  { id: "sla",        label: "Soporte y SLA",   icon: LifeBuoy },
  { id: "integrantes",label: "Integrantes",     icon: Users },
]

export function SeccionTI() {
  const { tab, setTab } = useSectionTab("ti", "politicas")
  const activo = TABS.find(t => t.id === tab) ?? TABS[0]

  return (
    <div>
      <PageHeader title="TI y Soporte" breadcrumb={["Departamentos", "TI y Soporte", activo.label]} />
      <div className="mb-4"><TabBar tabs={TABS} active={tab} onChange={setTab} /></div>
      <Pending owner="Medallitadeoro" desc="Mismo molde de tabs que SDI Portal — todavía sin contenido capturado." />
    </div>
  )
}
