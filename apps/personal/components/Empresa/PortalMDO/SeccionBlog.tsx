"use client"

import { useHeroImagen } from "./shared"
import { useGetIdentidad } from "@/api/identidad-empresa/getIdentidad"
import { SeccionVitrina, SeccionHeroContenido } from "./shared"
import { BlogView } from "@/components/Empresa/Marketing/BlogView"

export function SeccionBlog() {
  const { identidad, loading, reload } = useGetIdentidad()
  const documentId = identidad?.documentId ?? null
  useHeroImagen("portada_blog", documentId, reload)

  return (
    <SeccionVitrina>
      <SeccionHeroContenido
        breadcrumb={["Operación", "Blog"]}
        titulo="Blog"
        descripcion={identidad?.descripcion_blog || "Título, slug, contenido, subtítulos, portada e imágenes — todo el blog se edita desde aquí, sin tocar código."}
        campoDescripcion="descripcion_blog"
        onDescripcionGuardada={reload}
        documentId={documentId}
        puedeEditar={!loading}
      />
      <BlogView />
    </SeccionVitrina>
  )
}
