"use client"

import { Users, UserSearch, FileText, ShoppingBag, TrendingUp } from "lucide-react"
import { useSectionTab, HeroTabs, SeccionHero } from "./shared"
import { PipelineView } from "@/components/Empresa/Ventas/PipelineView"
import { LeadsView } from "@/components/Empresa/Ventas/LeadsView"
import { CotizacionesView } from "@/components/Empresa/Ventas/CotizacionesView"
import { PedidosView } from "@/components/Empresa/Ventas/PedidosView"
import { HistorialPipelineView } from "@/components/Empresa/Ventas/HistorialPipelineView"

const TABS = [
  { id: "pipeline",     label: "Pipeline",     icon: Users },
  { id: "leads",        label: "Leads",        icon: UserSearch },
  { id: "cotizaciones", label: "Cotizaciones", icon: FileText },
  { id: "pedidos",      label: "Pedidos",      icon: ShoppingBag },
  { id: "metricas",     label: "Métricas",     icon: TrendingUp },
]

export function SeccionVentas() {
  const { tab, setTab } = useSectionTab("ventas", "pipeline")
  const activo = TABS.find(t => t.id === tab) ?? TABS[0]

  return (
    <div className="space-y-4">
      <SeccionHero
        breadcrumb={["Operación", "Ventas", activo.label]}
        titulo="Ventas"
        descripcion="El embudo completo — de Lead a cotización a pedido confirmado."
      >
        <HeroTabs tabs={TABS} active={tab} onChange={setTab} />
      </SeccionHero>
      {tab === "pipeline"     && <PipelineView />}
      {tab === "leads"        && <LeadsView />}
      {tab === "cotizaciones" && <CotizacionesView />}
      {tab === "pedidos"      && <PedidosView />}
      {tab === "metricas"     && <HistorialPipelineView />}
    </div>
  )
}
