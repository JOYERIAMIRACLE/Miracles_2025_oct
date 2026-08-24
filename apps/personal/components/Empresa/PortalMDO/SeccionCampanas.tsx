"use client"

import { useState } from "react"
import { LayoutGrid, CalendarDays, BarChart2 } from "lucide-react"
import { SeccionHero, HeroTabs, useHeroImagen } from "./shared"
import { useGetIdentidad } from "@/api/identidad-empresa/getIdentidad"
import { CampanasPlannerView, TabCampanas } from "./CampanasPlannerView"

const TABS = [
  { id: "mensual" as const, label: "Calendario mensual", icon: LayoutGrid },
  { id: "semanal" as const, label: "Calendario semanal", icon: CalendarDays },
  { id: "metricas" as const, label: "Métricas", icon: BarChart2 },
]

export function SeccionCampanas() {
  const [tab, setTab] = useState<TabCampanas>("mensual")
  const { identidad, loading, reload } = useGetIdentidad()
  const documentId = identidad?.documentId ?? null
  const hero = useHeroImagen("portada_campanas", documentId, reload)

  return (
    <div className="space-y-4">
      <SeccionHero
        breadcrumb={["Operación", "Campañas"]}
        titulo="Campañas"
        descripcion={identidad?.descripcion_campanas || "Calendario de contenido — antes vivía dentro de Marketing, ahora aquí junto al resto del trabajo del día a día."}
        campoDescripcion="descripcion_campanas"
        onDescripcionGuardada={reload}
        imagenUrl={identidad?.portada_campanas?.url}
        imagenOriginalUrl={identidad?.portada_campanas_original?.url}
        documentId={documentId}
        puedeEditar={!loading}
        uploading={hero.uploading}
        inputRef={hero.inputRef}
        onTrigger={hero.trigger}
        onFileChange={hero.handleFile}
        onSaveCrop={hero.saveCrop}
      >
        <HeroTabs tabs={TABS} active={tab} onChange={id => setTab(id as TabCampanas)} />
      </SeccionHero>
      <CampanasPlannerView tab={tab} />
    </div>
  )
}
