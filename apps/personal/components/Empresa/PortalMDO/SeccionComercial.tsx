"use client"

import { Users, UserSearch, UserCheck, FileText, ShoppingBag, History, BarChart3, Users as Integrantes } from "lucide-react"
import { useSectionTab, TabBar, PageHeader, Pending } from "./shared"
import { PipelineView } from "@/components/Empresa/Ventas/PipelineView"
import { ClientesView } from "@/components/Empresa/Ventas/ClientesView"
import { LeadsView } from "@/components/Empresa/Ventas/LeadsView"
import { CotizacionesView } from "@/components/Empresa/Ventas/CotizacionesView"
import { PedidosView } from "@/components/Empresa/Ventas/PedidosView"
import { HistorialPipelineView } from "@/components/Empresa/Ventas/HistorialPipelineView"
import { OperativosView } from "@/components/Empresa/Indicadores/OperativosView"

const TABS = [
  { id: "pipeline",     label: "Pipeline (CRM)", icon: Users },
  { id: "leads",        label: "Leads",          icon: UserSearch },
  { id: "clientes",     label: "Clientes",       icon: UserCheck },
  { id: "cotizaciones", label: "Cotizaciones",   icon: FileText },
  { id: "pedidos",      label: "Pedidos",        icon: ShoppingBag },
  { id: "historial",    label: "Historial",      icon: History },
  { id: "metricas",     label: "Métricas",       icon: BarChart3 },
  { id: "integrantes",  label: "Integrantes",    icon: Integrantes },
]

export function SeccionComercial() {
  const { tab, setTab } = useSectionTab("comercial", "pipeline")
  const activo = TABS.find(t => t.id === tab) ?? TABS[0]

  return (
    <div>
      <PageHeader title="Comercial" breadcrumb={["Departamentos", "Comercial", activo.label]} />
      <div className="mb-4"><TabBar tabs={TABS} active={tab} onChange={setTab} /></div>
      {tab === "pipeline"     && <PipelineView />}
      {tab === "leads"        && <LeadsView />}
      {tab === "clientes"     && <ClientesView />}
      {tab === "cotizaciones" && <CotizacionesView />}
      {tab === "pedidos"      && <PedidosView />}
      {tab === "historial"    && <HistorialPipelineView />}
      {tab === "metricas"     && <OperativosView />}
      {tab === "integrantes"  && <Pending owner="Medallitadeoro" desc="Todavía no existe un directorio de colaboradores." />}
    </div>
  )
}
