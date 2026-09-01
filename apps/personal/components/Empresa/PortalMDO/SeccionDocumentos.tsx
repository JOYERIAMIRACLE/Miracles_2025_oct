"use client"

import { SeccionHero } from "./shared"
import { DocumentosLegalesView } from "./DocumentosLegalesView"

export function SeccionDocumentos() {
  return (
    <div className="space-y-4">
      <SeccionHero
        breadcrumb={["Recursos", "Documentos"]}
        titulo="Documentos"
        descripcion="Documentos legales de medalla de oro — antes vivía dentro de Finanzas, ahora aquí junto al resto de recursos."
      />
      <DocumentosLegalesView />
    </div>
  )
}
