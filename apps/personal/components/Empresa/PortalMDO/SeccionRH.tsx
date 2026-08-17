"use client"

import { Gift, BookOpen, GraduationCap, Siren } from "lucide-react"
import { useSectionTab, TabBar, SeccionHero, useHeroImagen } from "./shared"
import { useGetIdentidad } from "@/api/identidad-empresa/getIdentidad"
import { RHItemList } from "./RHItemList"
import { RecursosDescargables } from "./RecursosDescargables"

const TABS = [
  { id: "prestaciones", label: "Prestaciones",        icon: Gift },
  { id: "politicas",    label: "Políticas laborales", icon: BookOpen },
  { id: "capacitacion", label: "Capacitación",        icon: GraduationCap },
  { id: "emergencias",  label: "Emergencias",         icon: Siren },
]

export function SeccionRH() {
  const { tab, setTab } = useSectionTab("rh", "prestaciones")
  const activo = TABS.find(t => t.id === tab) ?? TABS[0]
  const { identidad, loading, reload } = useGetIdentidad()
  const documentId = identidad?.documentId ?? null
  const hero = useHeroImagen("portada_depto_rh", documentId, reload)

  return (
    <div className="space-y-4">
      <SeccionHero
        breadcrumb={["Departamentos", "Recursos Humanos", activo.label]}
        titulo="Recursos Humanos"
        descripcion={identidad?.descripcion_depto_rh || "Prestaciones, políticas laborales, capacitación y protocolos de emergencia para todo el equipo de medallitadeoro."}
        campoDescripcion="descripcion_depto_rh"
        onDescripcionGuardada={reload}
        imagenUrl={identidad?.portada_depto_rh?.url}
        imagenOriginalUrl={identidad?.portada_depto_rh_original?.url}
        documentId={documentId}
        puedeEditar={!loading}
        uploading={hero.uploading}
        inputRef={hero.inputRef}
        onTrigger={hero.trigger}
        onFileChange={hero.handleFile}
        onSaveCrop={hero.saveCrop}
      />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === "prestaciones" && (
        <RHItemList tipo="prestacion" titulo="Prestaciones" intro="Prestaciones disponibles para el equipo de medallitadeoro. Da clic en una para ver el detalle." />
      )}
      {tab === "politicas" && (
        <RHItemList tipo="politica" titulo="Políticas laborales" intro="Políticas laborales vigentes en medallitadeoro. Da clic en una para ver el detalle." />
      )}
      {tab === "capacitacion" && (
        <RecursosDescargables seccion="rh-capacitacion" layout="sidebar" />
      )}
      {tab === "emergencias" && (
        <RHItemList tipo="emergencia" titulo="Emergencias" intro="Directorio de contactos de emergencia. Acceso inmediato sin necesidad de buscar en correos." />
      )}
    </div>
  )
}
