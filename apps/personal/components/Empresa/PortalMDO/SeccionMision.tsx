"use client"

import { Compass, HeartHandshake, Smile, Church, LifeBuoy, GraduationCap } from "lucide-react"
import { useSectionTab, TabBar, PageHeader, Pending } from "./shared"

const TABS = [
  { id: "principios",  label: "Principios",           icon: Compass },
  { id: "valores",     label: "Valores",               icon: HeartHandshake },
  { id: "actitudes",   label: "Actitudes",             icon: Smile },
  { id: "espiritual",  label: "Formación Espiritual",  icon: Church },
  { id: "consejeria",  label: "Consejería",            icon: LifeBuoy },
  { id: "onboarding",  label: "Onboarding",            icon: GraduationCap },
]

export function SeccionMision() {
  const { tab, setTab } = useSectionTab("mision", "principios")
  const activo = TABS.find(t => t.id === tab) ?? TABS[0]

  return (
    <div>
      <PageHeader title="Misión" breadcrumb={["Departamentos", "Misión", activo.label]} />
      <div className="mb-4"><TabBar tabs={TABS} active={tab} onChange={setTab} /></div>
      <Pending owner="Medallitadeoro" desc="Mismo molde de tabs que SDI Portal — todavía sin contenido capturado." />
    </div>
  )
}
