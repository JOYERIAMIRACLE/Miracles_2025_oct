"use client"

import { SeccionHero } from "./shared"
import { CampanasPlannerView } from "./CampanasPlannerView"

export function SeccionCampanas() {
  return (
    <div className="space-y-4">
      <SeccionHero
        breadcrumb={["Operación", "Campañas"]}
        titulo="Campañas"
        descripcion="Calendario de contenido — antes vivía dentro de Marketing, ahora aquí junto al resto del trabajo del día a día."
      />
      <CampanasPlannerView />
    </div>
  )
}
