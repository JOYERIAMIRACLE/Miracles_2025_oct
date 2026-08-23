"use client"

import { Users, UserSearch } from "lucide-react"
import { useSectionTab, TabBar, SeccionHero } from "./shared"
import { PipelineView } from "@/components/Empresa/Ventas/PipelineView"
import { LeadsView } from "@/components/Empresa/Ventas/LeadsView"

const TABS = [
  { id: "pipeline", label: "Pipeline", icon: Users },
  { id: "leads",     label: "Leads",    icon: UserSearch },
]

export function SeccionCRM() {
  const { tab, setTab } = useSectionTab("crm", "pipeline")
  const activo = TABS.find(t => t.id === tab) ?? TABS[0]

  return (
    <div className="space-y-4">
      <SeccionHero
        breadcrumb={["Operación", "CRM", activo.label]}
        titulo="CRM"
        descripcion="El embudo (Funnel) de clientes — de Lead a Oferta a Pedido."
      />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      {tab === "pipeline" && <PipelineView />}
      {tab === "leads"    && <LeadsView />}
    </div>
  )
}
