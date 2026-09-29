"use client"

import { useState, useMemo } from "react"
import { Plus, X, Pencil, Loader2, BookOpen, Eye, EyeOff, ImagePlus, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { useGetBlogPosts, createBlogPost, updateBlogPost, publishBlogPost, unpublishBlogPost, deleteBlogPost } from "@/api/blog-post/getBlogPosts"
import { BlogPostType, BlockNode, CATEGORIA_BLOG_LABELS } from "@/types/blog-post"
import { cn } from "@/lib/utils"
import { uploadMedia } from "@/lib/upload"
import { BlogContenidoEditor } from "./BlogContenidoEditor"

const inp  = "w-full h-9 rounded-lg border border-slate-700 bg-[#2a1b3d] px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all"
const area = "w-full rounded-lg border border-slate-700 bg-[#2a1b3d] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-none transition-all"

const CATEGORIAS = Object.keys(CATEGORIA_BLOG_LABELS) as (keyof typeof CATEGORIA_BLOG_LABELS)[]

// Igual de simple que slugHeading() en BlogContenidoEditor.tsx, pero para el
// título completo del post (no un subtítulo dentro del contenido).
function slugify(texto: string): string {
  return texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

type Form = {
  titulo: string; slug: string; palabra_clave_objetivo: string; resumen: string; fecha_publicacion: string
  categoria_blog: string; seo_titulo: string; seo_descripcion: string; seo_keywords: string
  contenido: BlockNode[]
  imagen_portada: { id: number; url: string } | null
}

function emptyForm(): Form {
  return {
    titulo: "", slug: "", palabra_clave_objetivo: "", resumen: "", fecha_publicacion: new Date().toISOString().split("T")[0],
    categoria_blog: "", seo_titulo: "", seo_descripcion: "", seo_keywords: "",
    contenido: [], imagen_portada: null,
  }
}

export function BlogView() {
  const { posts, setPosts, loading } = useGetBlogPosts()
  const [filtro,    setFiltro]    = useState<"todos" | "publicado" | "borrador">("todos")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<BlogPostType | null>(null)
  const [form,      setForm]      = useState<Form>(emptyForm())
  const [saving,    setSaving]    = useState(false)
  const [delId,     setDelId]     = useState<string | null>(null)
  const [tab,       setTab]       = useState<"general" | "contenido" | "seo">("general")
  const [slugTocado, setSlugTocado] = useState(false)
  const [subiendoPortada, setSubiendoPortada] = useState(false)

  const filtrados = useMemo(() => {
    if (filtro === "publicado") return posts.filter(p => p.publishedAt)
    if (filtro === "borrador")  return posts.filter(p => !p.publishedAt)
    return posts
  }, [posts, filtro])

  const stats = useMemo(() => ({
    total:     posts.length,
    publicado: posts.filter(p => p.publishedAt).length,
    borrador:  posts.filter(p => !p.publishedAt).length,
  }), [posts])

  function openNuevo() { setEditing(null); setForm(emptyForm()); setSlugTocado(false); setTab("general"); setModalOpen(true) }
  function openEditar(p: BlogPostType) {
    setEditing(p)
    setForm({
      titulo:            p.titulo,
      slug:              p.slug,
      palabra_clave_objetivo: p.palabra_clave_objetivo ?? "",
      resumen:           p.resumen ?? "",
      fecha_publicacion: p.fecha_publicacion ?? new Date().toISOString().split("T")[0],
      categoria_blog:    p.categoria_blog ?? "",
      seo_titulo:        p.seo_titulo ?? "",
      seo_descripcion:   p.seo_descripcion ?? "",
      seo_keywords:      p.seo_keywords ?? "",
      contenido:         p.contenido ?? [],
      imagen_portada:    p.imagen_portada ? { id: p.imagen_portada.id, url: p.imagen_portada.url } : null,
    })
    setSlugTocado(true) // editando un post existente: nunca autotocar el slug desde el título
    setTab("general")
    setModalOpen(true)
  }

  function onTituloChange(titulo: string) {
    setForm(f => ({ ...f, titulo, slug: !editing && !slugTocado ? slugify(titulo) : f.slug }))
  }

  async function handleSave() {
    if (!form.titulo.trim()) { toast.error("El título es obligatorio"); return }
    if (!form.slug.trim()) { toast.error("El slug es obligatorio"); return }
    setSaving(true)
    try {
      const payload = {
        titulo:            form.titulo,
        slug:              form.slug,
        palabra_clave_objetivo: form.palabra_clave_objetivo || null,
        resumen:           form.resumen || null,
        fecha_publicacion: form.fecha_publicacion || null,
        categoria_blog:    form.categoria_blog || null,
        seo_titulo:        form.seo_titulo || null,
        seo_descripcion:   form.seo_descripcion || null,
        seo_keywords:      form.seo_keywords || null,
        contenido:         form.contenido,
        imagen_portada:    form.imagen_portada?.id ?? null,
      }
      if (editing) {
        const updated = await updateBlogPost(editing.documentId, payload)
        setPosts(prev => prev.map(p => p.documentId === editing.documentId ? updated : p))
        toast.success("Post actualizado — se verá en el sitio en unos minutos")
      } else {
        const nuevo = await createBlogPost(payload)
        setPosts(prev => [nuevo, ...prev])
        toast.success("Post creado — se verá en el sitio en unos minutos")
      }
      setModalOpen(false)
    } catch { toast.error("Error al guardar") }
    finally { setSaving(false) }
  }

  async function cambiarPortada(file: File) {
    setSubiendoPortada(true)
    try {
      const { id, url } = await uploadMedia(file)
      setForm(f => ({ ...f, imagen_portada: { id, url } }))
    } catch { toast.error("Error al subir la imagen") }
    finally { setSubiendoPortada(false) }
  }

  async function togglePublish(p: BlogPostType) {
    try {
      const updated = p.publishedAt ? await unpublishBlogPost(p.documentId) : await publishBlogPost(p.documentId)
      setPosts(prev => prev.map(x => x.documentId === p.documentId ? updated : x))
      toast.success(p.publishedAt ? "Post despublicado" : "Post publicado")
    } catch { toast.error("Error al cambiar estado") }
  }

  async function handleDelete(documentId: string) {
    try {
      await deleteBlogPost(documentId)
      setPosts(prev => prev.filter(p => p.documentId !== documentId))
      toast.success("Post eliminado")
    } catch { toast.error("Error al eliminar") }
    finally { setDelId(null) }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total",      value: stats.total,     color: "text-slate-200" },
          { label: "Publicados", value: stats.publicado, color: "text-violet-400" },
          { label: "Borradores", value: stats.borrador,  color: "text-violet-400" },
        ].map(k => (
          <div key={k.label} className="bg-[#2a1b3d] border border-slate-800 rounded-xl p-4">
            <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">{k.label}</p>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {(["todos", "publicado", "borrador"] as const).map(f => (
            <button key={f} type="button" onClick={() => setFiltro(f)}
              className={cn("h-8 px-3 text-xs rounded-lg border capitalize transition-colors",
                filtro === f ? "bg-violet-500/15 border-violet-500/30 text-violet-300" : "border-slate-700 text-slate-500 hover:text-slate-300"
              )}>
              {f}
            </button>
          ))}
        </div>
        <button type="button" onClick={openNuevo}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition-colors ml-auto">
          <Plus size={15} /> Nuevo post
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-[#2a1b3d] border border-slate-800 animate-pulse" />
        ))}
        {!loading && filtrados.length === 0 && (
          <div className="py-14 text-center text-slate-600">
            <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Sin posts registrados.</p>
          </div>
        )}
        {!loading && filtrados.map(p => (
          <div key={p.documentId} onClick={() => openEditar(p)}
            className="group flex items-center gap-3 bg-[#2a1b3d]/60 border border-slate-800 rounded-xl px-4 py-3 hover:border-slate-700 transition-colors cursor-pointer">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-slate-200 truncate">{p.titulo}</p>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0",
                  p.publishedAt ? "bg-violet-500/15 text-violet-300 border-violet-500/20" : "bg-violet-500/15 text-violet-300 border-violet-500/20"
                )}>
                  {p.publishedAt ? "Publicado" : "Borrador"}
                </span>
                {p.categoria_blog && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded border bg-slate-700/50 text-slate-400 border-slate-600/50 shrink-0">
                    {CATEGORIA_BLOG_LABELS[p.categoria_blog]}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">{p.fecha_publicacion ?? "Sin fecha"}{p.resumen ? ` · ${p.resumen.slice(0, 60)}…` : ""}</p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button type="button" onClick={e => { e.stopPropagation(); togglePublish(p) }} title={p.publishedAt ? "Despublicar" : "Publicar"}
                className="p-1.5 text-slate-600 hover:text-violet-400 hover:bg-[#2a1b3d] rounded transition">
                {p.publishedAt ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              <button type="button" onClick={e => { e.stopPropagation(); openEditar(p) }}
                className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-[#2a1b3d] rounded transition">
                <Pencil size={13} />
              </button>
              {delId === p.documentId ? (
                <div className="flex items-center gap-1 px-1" onClick={e => e.stopPropagation()}>
                  <button type="button" onClick={() => handleDelete(p.documentId)} className="text-[11px] text-red-400 hover:text-red-300 font-medium">Sí</button>
                  <button type="button" onClick={() => setDelId(null)} className="text-[11px] text-slate-500">No</button>
                </div>
              ) : (
                <button type="button" onClick={e => { e.stopPropagation(); setDelId(p.documentId) }}
                  className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-[#2a1b3d] rounded transition">
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="w-full max-w-4xl bg-[#2a1b3d] border border-slate-700 rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
              <h2 className="text-sm font-semibold text-slate-100">{editing ? "Editar post" : "Nuevo post"}</h2>
              <button type="button" onClick={() => setModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-[#2a1b3d]"><X size={16} /></button>
            </div>

            <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-800 shrink-0">
              {([["general", "General"], ["contenido", "Contenido"], ["seo", "Metadatos"]] as const).map(([id, label]) => (
                <button key={id} type="button" onClick={() => setTab(id)}
                  className={cn("px-3 h-8 text-xs font-medium rounded-t-lg border-b-2 transition-colors",
                    tab === id ? "border-violet-500 text-violet-300" : "border-transparent text-slate-500 hover:text-slate-300"
                  )}>
                  {label}
                </button>
              ))}
            </div>

            <div className="px-5 py-4 space-y-3 overflow-y-auto flex-1">
              {tab === "general" && (
                <>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Título <span className="text-red-400">*</span></label>
                    <input type="text" value={form.titulo} onChange={e => onTituloChange(e.target.value)} className={inp} placeholder="Título del post…" />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Slug (URL) <span className="text-red-400">*</span></label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-600 shrink-0">/blog/</span>
                      <input type="text" value={form.slug} onChange={e => { setSlugTocado(true); setForm(f => ({ ...f, slug: e.target.value })) }} className={inp} placeholder="slug-del-post" />
                    </div>
                    {editing && (
                      <p className="flex items-start gap-1.5 text-[10px] text-amber-400/80 mt-1.5">
                        <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                        Cambiar el slug de un post ya publicado rompe su enlace — hay que agregar una redirección a mano en apps/personal/public/_redirects.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Palabra clave objetivo</label>
                    <input type="text" value={form.palabra_clave_objetivo} onChange={e => setForm(f => ({ ...f, palabra_clave_objetivo: e.target.value }))} className={inp} placeholder="La keyword que este post debe posicionar…" />
                    <p className="text-[10px] text-slate-600 mt-1">No la lee Google directamente — es tu referencia para confirmar que aparece en título, slug, meta descripción y contenido.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Fecha publicación</label>
                      <input type="date" value={form.fecha_publicacion} onChange={e => setForm(f => ({ ...f, fecha_publicacion: e.target.value }))} className={inp} />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Categoría</label>
                      <select value={form.categoria_blog} onChange={e => setForm(f => ({ ...f, categoria_blog: e.target.value }))} className={inp + " cursor-pointer"}>
                        <option value="">Sin categoría</option>
                        {CATEGORIAS.map(c => <option key={c} value={c}>{CATEGORIA_BLOG_LABELS[c]}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Portada</label>
                    <div className="flex items-center gap-3">
                      {subiendoPortada ? (
                        <div className="w-24 h-16 rounded-lg bg-slate-800 flex items-center justify-center shrink-0"><Loader2 size={16} className="animate-spin text-violet-400" /></div>
                      ) : form.imagen_portada ? (
                        <img src={form.imagen_portada.url} alt="" className="w-24 h-16 rounded-lg object-cover border border-slate-700 shrink-0" />
                      ) : (
                        <div className="w-24 h-16 rounded-lg border border-dashed border-slate-700 flex items-center justify-center shrink-0"><ImagePlus size={16} className="text-slate-600" /></div>
                      )}
                      <div className="flex items-center gap-3">
                        <label className="text-[11px] text-violet-400 hover:text-violet-300 cursor-pointer">
                          {form.imagen_portada ? "Cambiar" : "Subir imagen"}
                          <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) cambiarPortada(f) }} />
                        </label>
                        {form.imagen_portada && (
                          <button type="button" onClick={() => setForm(f => ({ ...f, imagen_portada: null }))} className="text-[11px] text-slate-500 hover:text-red-400">Quitar</button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {tab === "contenido" && (
                <BlogContenidoEditor value={form.contenido} slug={form.slug} onChange={contenido => setForm(f => ({ ...f, contenido }))} />
              )}

              {tab === "seo" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Resumen</label>
                    <textarea rows={2} value={form.resumen} onChange={e => setForm(f => ({ ...f, resumen: e.target.value }))} className={area} placeholder="Adelanto del post — se ve en las tarjetas del blog, no en Google" />
                  </div>
                  <div className="border-t border-slate-800 pt-3 space-y-2">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">SEO</p>
                    <input type="text" placeholder="SEO título" value={form.seo_titulo} onChange={e => setForm(f => ({ ...f, seo_titulo: e.target.value }))} className={inp} />
                    <input type="text" placeholder="SEO descripción — el snippet que se ve en Google" value={form.seo_descripcion} onChange={e => setForm(f => ({ ...f, seo_descripcion: e.target.value }))} className={inp} />
                    <input type="text" placeholder="Keywords (separadas por coma)" value={form.seo_keywords} onChange={e => setForm(f => ({ ...f, seo_keywords: e.target.value }))} className={inp} />
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-800 shrink-0">
              <button type="button" onClick={() => setModalOpen(false)} disabled={saving}
                className="h-8 px-4 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-[#2a1b3d] transition">Cancelar</button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 h-8 px-4 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-50 transition">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editing ? "Guardar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
