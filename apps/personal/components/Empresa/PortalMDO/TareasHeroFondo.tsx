"use client"

import { SeccionHeroFondo, useHeroImagen } from "@/components/Empresa/PortalMDO/shared"
import { useGetIdentidad } from "@/api/identidad-empresa/getIdentidad"

/**
 * Fondo full-bleed del header de Tareas — vive AFUERA del container boxed
 * de page.tsx (igual que PortalHomeHero), a todo el ancho de <main>. El
 * breadcrumb/título/descripción/tabs de Tareas se renderizan aparte, boxed,
 * dentro de TareasView (ver SeccionHeroContenido en shared.tsx).
 */
export function TareasHeroFondo() {
  const { identidad, loading, reload } = useGetIdentidad()
  const documentId = identidad?.documentId ?? null
  const hero = useHeroImagen("portada_tareas", documentId, reload)

  return (
    <SeccionHeroFondo
      imagenUrl={identidad?.portada_tareas?.url}
      imagenOriginalUrl={identidad?.portada_tareas_original?.url}
      puedeEditar={!loading}
      uploading={hero.uploading}
      inputRef={hero.inputRef}
      onTrigger={hero.trigger}
      onFileChange={hero.handleFile}
      onSaveCrop={hero.saveCrop}
    />
  )
}
