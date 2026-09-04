import Link from "next/link"
import { BlogPostType, CATEGORIA_BLOG_LABELS } from "@/types/blog-post"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

function formatFecha(fecha: string | null) {
  if (!fecha) return ""
  return new Date(fecha + "T12:00:00").toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function BlogCard({ post }: { post: BlogPostType }) {
  const imgUrl = post.imagen_portada
    ? post.imagen_portada.url.startsWith("http")
      ? post.imagen_portada.url
      : `${BACKEND}${post.imagen_portada.url}`
    : null

  const categoriaLabel = post.categoria_blog
    ? CATEGORIA_BLOG_LABELS[post.categoria_blog]
    : null

  return (
    <Link href={`/blog/${post.slug}`}>
      <article className="group rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-lg transition-shadow duration-300">
        {imgUrl ? (
          <div className="aspect-[16/9] overflow-hidden">
            <img
              src={imgUrl}
              alt={post.imagen_portada?.alternativeText ?? post.titulo}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="aspect-[16/9] bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/20 dark:to-amber-800/20 flex items-center justify-center">
            <span className="text-4xl">💍</span>
          </div>
        )}

        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            {categoriaLabel && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                {categoriaLabel}
              </span>
            )}
            {post.fecha_publicacion && (
              <span className="text-xs text-gray-500">
                {formatFecha(post.fecha_publicacion)}
              </span>
            )}
          </div>

          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2 mb-2">
            {post.titulo}
          </h2>

          {post.resumen && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
              {post.resumen}
            </p>
          )}

          <p className="mt-4 text-xs font-semibold text-amber-600 dark:text-amber-400 group-hover:underline">
            Leer artículo →
          </p>
        </div>
      </article>
    </Link>
  )
}
