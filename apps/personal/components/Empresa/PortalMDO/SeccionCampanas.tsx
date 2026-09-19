"use client"

import { useState } from "react"
import { LayoutGrid, CalendarDays, BarChart2 } from "lucide-react"
import { SeccionVitrina, SeccionHeroContenido, ContenidoTabs, useHeroImagen } from "./shared"
import { useGetIdentidad } from "@/api/identidad-empresa/getIdentidad"
import { CampanasPlannerView, TabCampanas } from "./CampanasPlannerView"

const TABS = [
  { id: "mensual" as const, label: "Calendario mensual", icon: LayoutGrid },
  { id: "semanal" as const, label: "Calendario semanal", icon: CalendarDays },
  { id: "metricas" as const, label: "Métricas", icon: BarChart2 },
]

export function SeccionCampanas() {
  const [tab, setTab] = useState<TabCampanas>("semanal")
  const { identidad, loading, reload } = useGetIdentidad()
  const documentId = identidad?.documentId ?? null
  const hero = useHeroImagen("portada_campanas", documentId, reload)

  return (
    <SeccionVitrina>
      <SeccionHeroContenido
        breadcrumb={["Operación", "Campañas"]}
        titulo="Campañas"
        descripcion={identidad?.descripcion_campanas || "Calendario de contenido — antes vivía dentro de Marketing, ahora aquí junto al resto del trabajo del día a día."}
        campoDescripcion="descripcion_campanas"
        onDescripcionGuardada={reload}
        documentId={documentId}
        puedeEditar={!loading}
      >
        <ContenidoTabs tabs={TABS} active={tab} onChange={id => setTab(id as TabCampanas)} />
      </SeccionHeroContenido>
      <CampanasPlannerView tab={tab} />
    </SeccionVitrina>
  )
}
