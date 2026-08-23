"use client"

import { SeccionHero } from "./shared"
import { SitioWebMiraclesView } from "@/components/Empresa/Marketing/SitioWebMiraclesView"

export function SeccionSitioWeb() {
  return (
    <div className="space-y-4">
      <SeccionHero
        breadcrumb={["Operación", "Sitio web"]}
        titulo="Sitio web"
        descripcion="Planeador de páginas y sitemap de medallitadeoro.com — no es el editor en vivo de la tienda, es para organizar qué debería existir."
      />
      <SitioWebMiraclesView />
    </div>
  )
}
