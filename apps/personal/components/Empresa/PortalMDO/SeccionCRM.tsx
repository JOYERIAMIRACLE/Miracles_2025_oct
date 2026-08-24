"use client"

import { Users, UserSearch, BarChart3 } from "lucide-react"
import { useSectionTab, HeroTabs, SeccionHero } from "./shared"
import { PipelineView } from "@/components/Empresa/Ventas/PipelineView"
import { LeadsView } from "@/components/Empresa/Ventas/LeadsView"
import { HistorialPipelineView } from "@/components/Empresa/Ventas/HistorialPipelineView"

const TABS = [
  { id: "pipeline",  label: "Pipeline",  icon: Users },
  { id: "leads",     label: "Leads",     icon: UserSearch },
  { id: "metricas",  label: "Métricas",  icon: BarChart3 },
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
      >
        <HeroTabs tabs={TABS} active={tab} onChange={setTab} />
      </SeccionHero>
      {tab === "pipeline" && <PipelineView />}
      {tab === "leads"    && <LeadsView />}
      {tab === "metricas" && <HistorialPipelineView />}
    </div>
  )
}
