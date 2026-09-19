"use client"

import { Users, UserSearch, FileText, ShoppingBag, TrendingUp, Bell } from "lucide-react"
import { useSectionTab, SeccionVitrina, ContenidoTabs, SeccionHeroContenido, useHeroImagen } from "./shared"
import { useGetIdentidad } from "@/api/identidad-empresa/getIdentidad"
import { PipelineView } from "@/components/Empresa/Ventas/PipelineView"
import { LeadsView } from "@/components/Empresa/Ventas/LeadsView"
import { CotizacionesView } from "@/components/Empresa/Ventas/CotizacionesView"
import { PedidosView } from "@/components/Empresa/Ventas/PedidosView"
import { HistorialPipelineView } from "@/components/Empresa/Ventas/HistorialPipelineView"
import { DisparadoresView } from "@/components/Empresa/Ventas/DisparadoresView"

const TABS = [
  { id: "pipeline",      label: "Pipeline",      icon: Users },
  { id: "leads",         label: "Leads",         icon: UserSearch },
  { id: "cotizaciones",  label: "Cotizaciones",  icon: FileText },
  { id: "pedidos",       label: "Pedidos",        icon: ShoppingBag },
  { id: "metricas",      label: "Métricas",      icon: TrendingUp },
  { id: "disparadores",  label: "Disparadores",  icon: Bell },
]

export function SeccionVentas() {
  const { tab, setTab } = useSectionTab("ventas", "pipeline")
  const activo = TABS.find(t => t.id === tab) ?? TABS[0]
  const { identidad, loading, reload } = useGetIdentidad()
  const documentId = identidad?.documentId ?? null
  const hero = useHeroImagen("portada_ventas", documentId, reload)

  return (
    <SeccionVitrina>
      <SeccionHeroContenido
        breadcrumb={["Operación", "Ventas", activo.label]}
        titulo="Ventas"
        descripcion={identidad?.descripcion_ventas || "El embudo completo — de Lead a cotización a pedido confirmado."}
        campoDescripcion="descripcion_ventas"
        onDescripcionGuardada={reload}
        documentId={documentId}
        puedeEditar={!loading}
      >
        <ContenidoTabs tabs={TABS} active={tab} onChange={setTab} />
      </SeccionHeroContenido>
      {tab === "pipeline"     && <PipelineView />}
      {tab === "leads"        && <LeadsView />}
      {tab === "cotizaciones" && <CotizacionesView />}
      {tab === "pedidos"      && <PedidosView />}
      {tab === "metricas"     && <HistorialPipelineView />}
      {tab === "disparadores" && <DisparadoresView />}
    </SeccionVitrina>
  )
}
