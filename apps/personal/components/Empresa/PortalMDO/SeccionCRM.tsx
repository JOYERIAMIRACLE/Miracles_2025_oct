"use client"

import { useState } from "react"
import { Workflow, UserSearch, Bell } from "lucide-react"
import { useSectionTab, SeccionVitrina, ContenidoTabs, SeccionHeroContenido } from "./shared"
import { useGetIdentidad } from "@/api/identidad-empresa/getIdentidad"
import { PipelineView } from "@/components/Empresa/Ventas/PipelineView"
import { DisparadoresView } from "@/components/Empresa/Ventas/DisparadoresView"
import { LeadsPortalView } from "./LeadsPortalView"

// Pipeline, Leads y Disparadores se sacaron de Ventas — se sentían perdidos
// entre las gráficas del dashboard. Ventas queda para el embudo y los
// números; el seguimiento de prospectos vive aquí.
const TABS = [
  { id: "pipeline",     label: "Pipeline",     icon: Workflow },
  { id: "leads",        label: "Leads",        icon: UserSearch },
  { id: "disparadores", label: "Disparadores", icon: Bell },
]

export function SeccionCRM() {
  const { tab, setTab } = useSectionTab("crm", "pipeline")
  const activo = TABS.find(t => t.id === tab) ?? TABS[0]
  const { identidad, loading, reload } = useGetIdentidad()
  // Lead de una tarjeta del Pipeline que la pestaña Leads debe mostrar resaltado.
  const [leadFoco, setLeadFoco] = useState<string | null>(null)

  return (
    <SeccionVitrina>
      <SeccionHeroContenido
        breadcrumb={["Operación", activo.label]}
        titulo="CRM"
        descripcion={identidad?.descripcion_crm || "Pipeline visual y acciones pendientes con tus clientes, en un solo lugar."}
        campoDescripcion="descripcion_crm"
        onDescripcionGuardada={reload}
        documentId={identidad?.documentId ?? null}
        puedeEditar={!loading}
      >
        <ContenidoTabs tabs={TABS} active={tab} onChange={setTab} />
      </SeccionHeroContenido>
      {tab === "pipeline"     && <PipelineView onAbrirLead={l => { setLeadFoco(l.documentId); setTab("leads") }} />}
      {tab === "leads"        && <LeadsPortalView leadFoco={leadFoco} onFocoConsumido={() => setLeadFoco(null)} />}
      {tab === "disparadores" && <DisparadoresView />}
    </SeccionVitrina>
  )
}
