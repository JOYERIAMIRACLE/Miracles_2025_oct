"use client"

import { Gift, BookOpen, GraduationCap, Siren, Users } from "lucide-react"
import { useSectionTab, TabBar, PageHeader, Pending } from "./shared"

const TABS = [
  { id: "prestaciones", label: "Prestaciones",         icon: Gift },
  { id: "politicas",    label: "Políticas laborales",  icon: BookOpen },
  { id: "capacitacion", label: "Capacitación",         icon: GraduationCap },
  { id: "emergencias",  label: "Emergencias",          icon: Siren },
  { id: "integrantes",  label: "Integrantes",          icon: Users },
]

export function SeccionRH() {
  const { tab, setTab } = useSectionTab("rh", "prestaciones")
  const activo = TABS.find(t => t.id === tab) ?? TABS[0]

  return (
    <div>
      <PageHeader title="Recursos Humanos" breadcrumb={["Departamentos", "RH", activo.label]} />
      <div className="mb-4"><TabBar tabs={TABS} active={tab} onChange={setTab} /></div>
      <Pending owner="Medallitadeoro" desc="Mismo molde de tabs que SDI Portal — todavía sin contenido capturado." />
    </div>
  )
}
