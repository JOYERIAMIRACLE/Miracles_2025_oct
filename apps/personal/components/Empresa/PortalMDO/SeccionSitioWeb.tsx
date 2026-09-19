"use client"

import { useHeroImagen } from "./shared"
import { useGetIdentidad } from "@/api/identidad-empresa/getIdentidad"
import { SitioWebMiraclesView } from "@/components/Empresa/Marketing/SitioWebMiraclesView"

export function SeccionSitioWeb() {
  const { identidad, loading, reload } = useGetIdentidad()
  const documentId = identidad?.documentId ?? null
  const hero = useHeroImagen("portada_sitio_web", documentId, reload)

  return (
    <SitioWebMiraclesView
      heroExterno
      breadcrumb={["Operación", "Sitio web"]}
      titulo="Sitio web"
      descripcion={identidad?.descripcion_sitio_web || "Planeador de páginas y sitemap de medallitadeoro.com — no es el editor en vivo de la tienda, es para organizar qué debería existir."}
      campoDescripcion="descripcion_sitio_web"
      onDescripcionGuardada={reload}
      documentId={documentId}
      puedeEditar={!loading}
    />
  )
}
