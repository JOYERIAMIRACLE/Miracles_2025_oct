import { useEffect, useState } from "react"
import { BlogPostType } from "@/types/blog-post"
import { authFetch } from "@/lib/auth"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export function useGetBlogPosts() {
  const [posts,   setPosts]   = useState<BlogPostType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        // "status=draft,published" no es sintaxis válida en Strapi 5 (el
        // parámetro solo acepta un único valor) — devolvía casi todo vacío
        // en silencio. Sin status, la API ya regresa el documento completo
        // por slug (draft o published, el que exista), que es lo que esta
        // lista necesita mostrar.
        const res  = await authFetch(`${BASE}/api/blog-posts?pagination[pageSize]=200&sort=fecha_publicacion:desc&populate=imagen_portada`)
        const json = await res.json()
        setPosts(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [])

  return { posts, setPosts, loading }
}

export async function createBlogPost(payload: Record<string, unknown>): Promise<BlogPostType> {
  const res = await authFetch(`${BASE}/api/blog-posts?populate=imagen_portada`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  return (await res.json()).data
}

export async function updateBlogPost(documentId: string, payload: Record<string, unknown>): Promise<BlogPostType> {
  const res = await authFetch(`${BASE}/api/blog-posts/${documentId}?populate=imagen_portada`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  return (await res.json()).data
}

export async function publishBlogPost(documentId: string): Promise<BlogPostType> {
  const res = await authFetch(`${BASE}/api/blog-posts/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { publishedAt: new Date().toISOString() } }),
  })
  return (await res.json()).data
}

export async function unpublishBlogPost(documentId: string): Promise<BlogPostType> {
  const res = await authFetch(`${BASE}/api/blog-posts/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { publishedAt: null } }),
  })
  return (await res.json()).data
}

export async function deleteBlogPost(documentId: string) {
  await authFetch(`${BASE}/api/blog-posts/${documentId}`, { method: "DELETE" })
}
