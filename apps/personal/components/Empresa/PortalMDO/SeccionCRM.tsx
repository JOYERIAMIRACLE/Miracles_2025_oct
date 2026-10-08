"use client"

import { Workflow, Bell } from "lucide-react"
import { useSectionTab, SeccionVitrina, ContenidoTabs, SeccionHeroContenido } from "./shared"
import { useGetIdentidad } from "@/api/identidad-empresa/getIdentidad"
import { PipelineView } from "@/components/Empresa/Ventas/PipelineView"
import { DisparadoresView } from "@/components/Empresa/Ventas/DisparadoresView"

// Casa provisional para Pipeline y Disparadores, sacados de Ventas — antes
// vivían ahí como tabs, pero se sentían perdidos entre las gráficas del
// dashboard. Por mientras no se arma un CRM más completo, esto les da
// identidad propia en el sidebar sin duplicar nada.
const TABS = [
  { id: "pipeline",     label: "Pipeline",     icon: Workflow },
  { id: "disparadores", label: "Disparadores", icon: Bell },
]

export function SeccionCRM() {
  const { tab, setTab } = useSectionTab("crm", "pipeline")
  const activo = TABS.find(t => t.id === tab) ?? TABS[0]
  const { identidad, loading, reload } = useGetIdentidad()

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
      {tab === "pipeline"     && <PipelineView />}
      {tab === "disparadores" && <DisparadoresView />}
    </SeccionVitrina>
  )
}
