"use client"

import { useState, useMemo } from "react"
import { Plus, X, Pencil, Loader2, BookOpen, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { useGetBlogPosts, createBlogPost, updateBlogPost, publishBlogPost, unpublishBlogPost, deleteBlogPost } from "@/api/blog-post/getBlogPosts"
import { BlogPostType, CATEGORIA_BLOG_LABELS } from "@/types/blog-post"
import { cn } from "@/lib/utils"

const inp  = "w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
const area = "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none transition-all"

const CATEGORIAS = Object.keys(CATEGORIA_BLOG_LABELS) as (keyof typeof CATEGORIA_BLOG_LABELS)[]

type Form = {
  titulo: string; resumen: string; fecha_publicacion: string
  categoria_blog: string; seo_titulo: string; seo_descripcion: string; seo_keywords: string
}

function emptyForm(): Form {
  return { titulo: "", resumen: "", fecha_publicacion: new Date().toISOString().split("T")[0], categoria_blog: "", seo_titulo: "", seo_descripcion: "", seo_keywords: "" }
}

export function BlogView() {
  const { posts, setPosts, loading } = useGetBlogPosts()
  const [filtro,    setFiltro]    = useState<"todos" | "publicado" | "borrador">("todos")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState<BlogPostType | null>(null)
  const [form,      setForm]      = useState<Form>(emptyForm())
  const [saving,    setSaving]    = useState(false)
  const [delId,     setDelId]     = useState<string | null>(null)

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

  function openNuevo() { setEditing(null); setForm(emptyForm()); setModalOpen(true) }
  function openEditar(p: BlogPostType) {
    setEditing(p)
    setForm({
      titulo:            p.titulo,
      resumen:           p.resumen ?? "",
      fecha_publicacion: p.fecha_publicacion ?? new Date().toISOString().split("T")[0],
      categoria_blog:    p.categoria_blog ?? "",
      seo_titulo:        p.seo_titulo ?? "",
      seo_descripcion:   p.seo_descripcion ?? "",
      seo_keywords:      p.seo_keywords ?? "",
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.titulo.trim()) { toast.error("El título es obligatorio"); return }
    setSaving(true)
    try {
      const payload = {
        titulo:            form.titulo,
        resumen:           form.resumen || null,
        fecha_publicacion: form.fecha_publicacion || null,
        categoria_blog:    form.categoria_blog || null,
        seo_titulo:        form.seo_titulo || null,
        seo_descripcion:   form.seo_descripcion || null,
        seo_keywords:      form.seo_keywords || null,
      }
      if (editing) {
        const updated = await updateBlogPost(editing.documentId, payload)
        setPosts(prev => prev.map(p => p.documentId === editing.documentId ? updated : p))
        toast.success("Post actualizado")
      } else {
        const nuevo = await createBlogPost(payload)
        setPosts(prev => [nuevo, ...prev])
        toast.success("Post creado")
      }
      setModalOpen(false)
    } catch { toast.error("Error al guardar") }
    finally { setSaving(false) }
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
          { label: "Publicados", value: stats.publicado, color: "text-emerald-400" },
          { label: "Borradores", value: stats.borrador,  color: "text-amber-400" },
        ].map(k => (
          <div key={k.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
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
                filtro === f ? "bg-blue-500/15 border-blue-500/30 text-blue-300" : "border-slate-700 text-slate-500 hover:text-slate-300"
              )}>
              {f}
            </button>
          ))}
        </div>
        <button type="button" onClick={openNuevo}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors ml-auto">
          <Plus size={15} /> Nuevo post
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-900 border border-slate-800 animate-pulse" />
        ))}
        {!loading && filtrados.length === 0 && (
          <div className="py-14 text-center text-slate-600">
            <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Sin posts registrados.</p>
          </div>
        )}
        {!loading && filtrados.map(p => (
          <div key={p.documentId} className="group flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 hover:border-slate-700 transition-colors">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-slate-200 truncate">{p.titulo}</p>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0",
                  p.publishedAt ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/20" : "bg-amber-500/15 text-amber-300 border-amber-500/20"
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
              <button type="button" onClick={() => togglePublish(p)} title={p.publishedAt ? "Despublicar" : "Publicar"}
                className="p-1.5 text-slate-600 hover:text-emerald-400 hover:bg-slate-800 rounded transition">
                {p.publishedAt ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              <button type="button" onClick={() => openEditar(p)}
                className="p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded transition">
                <Pencil size={13} />
              </button>
              {delId === p.documentId ? (
                <div className="flex items-center gap-1 px-1">
                  <button type="button" onClick={() => handleDelete(p.documentId)} className="text-[11px] text-red-400 hover:text-red-300 font-medium">Sí</button>
                  <button type="button" onClick={() => setDelId(null)} className="text-[11px] text-slate-500">No</button>
                </div>
              ) : (
                <button type="button" onClick={() => setDelId(p.documentId)}
                  className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded transition">
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
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
              <h2 className="text-sm font-semibold text-slate-100">{editing ? "Editar post" : "Nuevo post"}</h2>
              <button type="button" onClick={() => setModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800"><X size={16} /></button>
            </div>
            <div className="px-5 py-4 space-y-3 overflow-y-auto flex-1">
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Título <span className="text-red-400">*</span></label>
                <input type="text" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} className={inp} placeholder="Título del post…" />
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
                <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">Resumen</label>
                <textarea rows={2} value={form.resumen} onChange={e => setForm(f => ({ ...f, resumen: e.target.value }))} className={area} placeholder="Descripción breve del post…" />
              </div>
              <p className="text-[10px] text-slate-600">El contenido detallado se edita desde el panel de Strapi.</p>
              <div className="border-t border-slate-800 pt-3 space-y-2">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">SEO</p>
                <input type="text" placeholder="SEO título" value={form.seo_titulo} onChange={e => setForm(f => ({ ...f, seo_titulo: e.target.value }))} className={inp} />
                <input type="text" placeholder="SEO descripción" value={form.seo_descripcion} onChange={e => setForm(f => ({ ...f, seo_descripcion: e.target.value }))} className={inp} />
                <input type="text" placeholder="Keywords (separadas por coma)" value={form.seo_keywords} onChange={e => setForm(f => ({ ...f, seo_keywords: e.target.value }))} className={inp} />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-800 shrink-0">
              <button type="button" onClick={() => setModalOpen(false)} disabled={saving}
                className="h-8 px-4 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">Cancelar</button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 h-8 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-50 transition">
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
