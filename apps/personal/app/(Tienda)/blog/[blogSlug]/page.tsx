import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { BlogPostType, CATEGORIA_BLOG_LABELS } from "@/types/blog-post"
import BlocksRenderer from "../components/BlocksRenderer"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://miracles-frontend.pages.dev"

async function fetchPost(slug: string): Promise<BlogPostType | null> {
  try {
    const res = await fetch(
      `${BACKEND}/api/blog-posts?filters[slug][$eq]=${slug}&populate=imagen_portada`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return null
    const json = await res.json()
    return (json.data?.[0] as BlogPostType) ?? null
  } catch {
    return null
  }
}

export async function generateStaticParams() {
  try {
    const res = await fetch(
      `${BACKEND}/api/blog-posts?fields[0]=slug&pagination[pageSize]=200`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return [{ blogSlug: "inicio" }]
    const json = await res.json()
    const items = (json.data || [])
      .map((p: { slug?: string }) => ({ blogSlug: p.slug ?? "" }))
      .filter((p: { blogSlug: string }) => Boolean(p.blogSlug))
    return items.length > 0 ? items : [{ blogSlug: "inicio" }]
  } catch {
    return [{ blogSlug: "inicio" }]
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ blogSlug: string }>
}): Promise<Metadata> {
  const { blogSlug } = await params
  const post = await fetchPost(blogSlug)

  if (!post) return { title: "Artículo no encontrado" }

  const metaTitulo    = post.seo_titulo ?? post.titulo
  const descripcion   = post.seo_descripcion ?? post.resumen?.slice(0, 160) ?? `${post.titulo} — Blog Joyería Miracles`

  const imgUrl = post.imagen_portada
    ? post.imagen_portada.url.startsWith("http")
      ? post.imagen_portada.url
      : `${BACKEND}${post.imagen_portada.url}`
    : undefined

  return {
    title: metaTitulo,
    description: descripcion,
    alternates: { canonical: `${SITE}/blog/${post.slug}` },
    ...(post.seo_keywords && { keywords: post.seo_keywords }),
    openGraph: {
      title: `${metaTitulo} | Joyería Miracles`,
      description: descripcion,
      type: "article",
      publishedTime: post.fecha_publicacion ?? undefined,
      ...(imgUrl && { images: [{ url: imgUrl, alt: post.titulo }] }),
    },
  }
}

function formatFecha(fecha: string | null) {
  if (!fecha) return ""
  return new Date(fecha + "T12:00:00").toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ blogSlug: string }>
}) {
  const { blogSlug } = await params
  const post = await fetchPost(blogSlug)

  if (!post) return notFound()

  const imgUrl = post.imagen_portada
    ? post.imagen_portada.url.startsWith("http")
      ? post.imagen_portada.url
      : `${BACKEND}${post.imagen_portada.url}`
    : undefined

  const descripcion =
    post.seo_descripcion ??
    post.resumen?.slice(0, 160) ??
    `${post.titulo} — Blog Joyería Miracles`

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.titulo,
    description: descripcion,
    ...(imgUrl && { image: imgUrl }),
    ...(post.fecha_publicacion && { datePublished: post.fecha_publicacion }),
    publisher: {
      "@type": "Organization",
      name: "Joyería Miracles",
      url: SITE,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE}/blog/${post.slug}`,
    },
  }

  const categoriaLabel = post.categoria_blog
    ? CATEGORIA_BLOG_LABELS[post.categoria_blog]
    : null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="max-w-3xl mx-auto px-6 sm:px-8 py-12">

        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-amber-600">Inicio</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-amber-600">Blog</Link>
          <span>/</span>
          <span className="text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{post.titulo}</span>
        </nav>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-4">
          {categoriaLabel && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
              {categoriaLabel}
            </span>
          )}
          {post.fecha_publicacion && (
            <time
              dateTime={post.fecha_publicacion}
              className="text-sm text-gray-500"
            >
              {formatFecha(post.fecha_publicacion)}
            </time>
          )}
        </div>

        {/* Título */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight mb-4">
          {post.titulo}
        </h1>

        {/* Resumen */}
        {post.resumen && (
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed border-l-4 border-amber-400 pl-4">
            {post.resumen}
          </p>
        )}

        {/* Imagen portada */}
        {imgUrl && (
          <figure className="mb-10 rounded-2xl overflow-hidden">
            <img
              src={imgUrl}
              alt={post.imagen_portada?.alternativeText ?? post.titulo}
              className="w-full object-cover max-h-[480px]"
              loading="lazy"
            />
          </figure>
        )}

        {/* Contenido */}
        {post.contenido && post.contenido.length > 0 && (
          <BlocksRenderer blocks={post.contenido} />
        )}

        {/* Volver */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <Link
            href="/blog"
            className="text-sm font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400"
          >
            ← Volver al Blog
          </Link>
        </div>

      </article>
    </>
  )
}
