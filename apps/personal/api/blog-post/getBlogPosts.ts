import { useEffect, useState } from "react"
import { BlogPostType } from "@/types/blog-post"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export function useGetBlogPosts() {
  const [posts,   setPosts]   = useState<BlogPostType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch(`${BASE}/api/blog-posts?pagination[pageSize]=200&sort=fecha_publicacion:desc&status=draft,published`)
        const json = await res.json()
        setPosts(json.data ?? [])
      } finally { setLoading(false) }
    })()
  }, [])

  return { posts, setPosts, loading }
}

export async function createBlogPost(payload: Record<string, unknown>): Promise<BlogPostType> {
  const res = await fetch(`${BASE}/api/blog-posts`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  return (await res.json()).data
}

export async function updateBlogPost(documentId: string, payload: Record<string, unknown>): Promise<BlogPostType> {
  const res = await fetch(`${BASE}/api/blog-posts/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  })
  return (await res.json()).data
}

export async function publishBlogPost(documentId: string): Promise<BlogPostType> {
  const res = await fetch(`${BASE}/api/blog-posts/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { publishedAt: new Date().toISOString() } }),
  })
  return (await res.json()).data
}

export async function unpublishBlogPost(documentId: string): Promise<BlogPostType> {
  const res = await fetch(`${BASE}/api/blog-posts/${documentId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { publishedAt: null } }),
  })
  return (await res.json()).data
}

export async function deleteBlogPost(documentId: string) {
  await fetch(`${BASE}/api/blog-posts/${documentId}`, { method: "DELETE" })
}
