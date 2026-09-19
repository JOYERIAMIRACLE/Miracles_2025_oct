"use client"

import { SeccionVitrina, SeccionHeroContenido, useHeroImagen } from "./shared"
import { useGetIdentidad } from "@/api/identidad-empresa/getIdentidad"
import { DocumentosLegalesView } from "./DocumentosLegalesView"

export function SeccionDocumentos() {
  const { identidad, loading, reload } = useGetIdentidad()
  const documentId = identidad?.documentId ?? null
  const hero = useHeroImagen("portada_documentos", documentId, reload)

  return (
    <SeccionVitrina>
      <SeccionHeroContenido
        breadcrumb={["Recursos", "Documentos"]}
        titulo="Documentos"
        descripcion={identidad?.descripcion_documentos || "Documentos legales de medalla de oro — antes vivía dentro de Finanzas, ahora aquí junto al resto de recursos."}
        campoDescripcion="descripcion_documentos"
        onDescripcionGuardada={reload}
        documentId={documentId}
        puedeEditar={!loading}
      />
      <DocumentosLegalesView />
    </SeccionVitrina>
  )
}
