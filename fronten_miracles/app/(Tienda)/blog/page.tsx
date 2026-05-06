import type { Metadata } from "next"
import { BlogPostType } from "@/types/blog-post"
import BlogCard from "./components/BlogCard"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

async function fetchBlogPosts(): Promise<BlogPostType[]> {
  try {
    const res = await fetch(
      `${BACKEND}/api/blog-posts?populate=imagen_portada&sort=fecha_publicacion:desc&pagination[pageSize]=50`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return []
    const json = await res.json()
    return (json.data as BlogPostType[]) ?? []
  } catch {
    return []
  }
}

export const metadata: Metadata = {
  title: "Blog",
  description: "Tips de joyería, tendencias, guías de regalo y cuidado de tus joyas. Todo lo que necesitas saber sobre joyería en Miracles.",
  openGraph: {
    title: "Blog | Joyería Miracles",
    description: "Tips de joyería, tendencias y guías de regalo.",
  },
}

export default async function BlogPage() {
  const posts = await fetchBlogPosts()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Blog | Joyería Miracles",
    description: "Tips de joyería, tendencias, guías de regalo y cuidado de tus joyas.",
    publisher: {
      "@type": "Organization",
      name: "Joyería Miracles",
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-amber-50 to-white dark:from-gray-900 dark:to-gray-950 py-16 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-gray-100 mb-4">
          Blog Joyería Miracles
        </h1>
        <p className="max-w-xl mx-auto text-lg text-gray-600 dark:text-gray-400">
          Tips, tendencias y todo lo que debes saber sobre tus joyas de oro y plata.
        </p>
      </section>

      {/* Grid de artículos */}
      <section className="max-w-6xl mx-auto px-6 sm:px-12 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-2xl text-gray-400">Próximamente...</p>
            <p className="text-gray-500 mt-2">Estamos preparando contenido para ti.</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map(post => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
