"use client"

import { ShieldCheck, FileCheck, Map as MapIcon, ClipboardCheck, Users } from "lucide-react"
import { useSectionTab, TabBar, PageHeader, Pending } from "./shared"

const TABS = [
  { id: "protocolos", label: "Protocolos HSE",       icon: ShieldCheck },
  { id: "normativas", label: "Normativas y certs.",  icon: FileCheck },
  { id: "layouts",    label: "Layouts de planta",    icon: MapIcon },
  { id: "formatos",   label: "Formatos de mejora",   icon: ClipboardCheck },
  { id: "integrantes",label: "Integrantes",          icon: Users },
]

export function SeccionSeguridad() {
  const { tab, setTab } = useSectionTab("seguridad", "protocolos")
  const activo = TABS.find(t => t.id === tab) ?? TABS[0]

  return (
    <div>
      <PageHeader title="Seguridad" breadcrumb={["Departamentos", "Seguridad", activo.label]} />
      <div className="mb-4"><TabBar tabs={TABS} active={tab} onChange={setTab} /></div>
      <Pending owner="Medallitadeoro" desc="Mismo molde de tabs que SDI Portal — todavía sin contenido capturado." />
    </div>
  )
}
