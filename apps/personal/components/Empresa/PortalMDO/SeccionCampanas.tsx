"use client"

import { SeccionHero, useHeroImagen } from "./shared"
import { useGetIdentidad } from "@/api/identidad-empresa/getIdentidad"
import { CampanasPlannerView } from "./CampanasPlannerView"

export function SeccionCampanas() {
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
      />
      <CampanasPlannerView />
    </div>
  )
}
