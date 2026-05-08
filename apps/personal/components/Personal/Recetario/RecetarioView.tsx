"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Pencil, Trash2, X, Search, ExternalLink, Clock,
  ChefHat, Play, BookOpen, Flame, Star, Coffee, Sun, Moon,
  Cookie, Cake, Package, ShoppingCart,
} from "lucide-react"
import { toast } from "sonner"
import { DespensaTab } from "./DespensaTab"
import { ComprasTab }  from "./ComprasTab"

type TabId = "recetas" | "despensa" | "compras"

// ─── Types ────────────────────────────────────────────────────────────────────
type Categoria = "desayuno" | "comida" | "cena" | "snack" | "postre"
type Dificultad = "fácil" | "media" | "difícil"

type Receta = {
  id: string
  nombre: string
  descripcion: string
  categoria: Categoria
  videoUrl: string
  tiempoPrep: number
  dificultad: Dificultad
  notas: string
  creadoEn: string
}

type RecetaForm = Omit<Receta, "id" | "creadoEn">

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIAS: { key: Categoria | "todas"; label: string; icon: React.ElementType; color: string }[] = [
  { key: "todas",     label: "Todas",     icon: BookOpen, color: "cyan"   },
  { key: "desayuno",  label: "Desayuno",  icon: Coffee,   color: "amber"  },
  { key: "comida",    label: "Comida",    icon: Sun,      color: "green"  },
  { key: "cena",      label: "Cena",      icon: Moon,     color: "blue"   },
  { key: "snack",     label: "Snack",     icon: Cookie,   color: "purple" },
  { key: "postre",    label: "Postre",    icon: Cake,     color: "pink"   },
]

const DIFICULTADES: { key: Dificultad; label: string }[] = [
  { key: "fácil",   label: "Fácil"   },
  { key: "media",   label: "Media"   },
  { key: "difícil", label: "Difícil" },
]

const CAT_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  amber:  { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/30",   glow: "shadow-amber-500/10"  },
  green:  { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", glow: "shadow-emerald-500/10"},
  blue:   { bg: "bg-blue-500/10",    text: "text-blue-400",    border: "border-blue-500/30",    glow: "shadow-blue-500/10"   },
  purple: { bg: "bg-violet-500/10",  text: "text-violet-400",  border: "border-violet-500/30",  glow: "shadow-violet-500/10" },
  pink:   { bg: "bg-pink-500/10",    text: "text-pink-400",    border: "border-pink-500/30",    glow: "shadow-pink-500/10"   },
  cyan:   { bg: "bg-cyan-500/10",    text: "text-cyan-400",    border: "border-cyan-500/30",    glow: "shadow-cyan-500/10"   },
}

const DIFIC_COLORS: Record<Dificultad, string> = {
  "fácil":   "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  "media":   "text-amber-400 bg-amber-500/10 border-amber-500/20",
  "difícil": "text-red-400 bg-red-500/10 border-red-500/20",
}

const DIFIC_STARS: Record<Dificultad, number> = { "fácil": 1, "media": 2, "difícil": 3 }

const STORAGE_KEY = "miracles_recetario"

const FORM_EMPTY: RecetaForm = {
  nombre: "", descripcion: "", categoria: "comida",
  videoUrl: "", tiempoPrep: 30, dificultad: "fácil", notas: "",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getYoutubeThumbnail(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  if (match) return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`
  return null
}

function catColorOf(categoria: Categoria): typeof CAT_COLORS[string] {
  const cat = CATEGORIAS.find(c => c.key === categoria)
  return CAT_COLORS[cat?.color ?? "cyan"]
}

function catIconOf(categoria: Categoria): React.ElementType {
  return CATEGORIAS.find(c => c.key === categoria)?.icon ?? BookOpen
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function RecetaCard({ receta, onEdit, onDelete, onView }: {
  receta: Receta
  onEdit: () => void
  onDelete: () => void
  onView: () => void
}) {
  const c = catColorOf(receta.categoria)
  const CatIcon = catIconOf(receta.categoria)
  const thumb = receta.videoUrl ? getYoutubeThumbnail(receta.videoUrl) : null
  const stars = DIFIC_STARS[receta.dificultad]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`group relative rounded-xl bg-slate-900/60 border ${c.border} backdrop-blur-sm overflow-hidden cursor-pointer hover:shadow-lg ${c.glow} transition-all duration-300`}
      onClick={onView}
    >
      {/* Thumbnail o placeholder */}
      <div className="relative h-32 overflow-hidden">
        {thumb ? (
          <img src={thumb} alt={receta.nombre} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" />
        ) : (
          <div className={`h-full flex items-center justify-center ${c.bg}`}>
            <CatIcon className={`h-10 w-10 ${c.text} opacity-30`} />
          </div>
        )}
        {receta.videoUrl && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="h-10 w-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center">
              <Play className="h-4 w-4 text-white ml-0.5" />
            </div>
          </div>
        )}
        {/* Category badge */}
        <div className="absolute top-2 left-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${c.bg} ${c.text} ${c.border}`}>
            <CatIcon className="h-2.5 w-2.5" />
            {receta.categoria}
          </span>
        </div>
        {/* Actions */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            aria-label="Editar receta"
            onClick={onEdit}
            className="h-6 w-6 rounded-md bg-slate-800/80 border border-slate-600/50 text-slate-400 hover:text-cyan-400 flex items-center justify-center transition-colors"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            type="button"
            aria-label="Eliminar receta"
            onClick={onDelete}
            className="h-6 w-6 rounded-md bg-slate-800/80 border border-slate-600/50 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white truncate">{receta.nombre}</h3>
        {receta.descripcion && (
          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{receta.descripcion}</p>
        )}
        <div className="flex items-center justify-between mt-2.5">
          <div className="flex items-center gap-2.5 text-[10px] text-slate-600">
            {receta.tiempoPrep > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {receta.tiempoPrep} min
              </span>
            )}
            <span className="flex items-center gap-0.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Star key={i} className={`h-2.5 w-2.5 ${i < stars ? "text-amber-400 fill-amber-400" : "text-slate-700"}`} />
              ))}
            </span>
          </div>
          {receta.videoUrl && (
            <span className={`text-[9px] font-semibold ${c.text} flex items-center gap-0.5`}>
              <Play className="h-2.5 w-2.5" /> Video
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function RecetaModal({ receta, onClose }: { receta: Receta; onClose: () => void }) {
  const c = catColorOf(receta.categoria)
  const CatIcon = catIconOf(receta.categoria)
  const thumb = receta.videoUrl ? getYoutubeThumbnail(receta.videoUrl) : null
  const stars = DIFIC_STARS[receta.dificultad]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className={`relative w-full max-w-lg rounded-2xl bg-slate-900 border ${c.border} shadow-2xl overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header thumbnail */}
        <div className="relative h-40 overflow-hidden">
          {thumb ? (
            <img src={thumb} alt={receta.nombre} className="w-full h-full object-cover opacity-60" />
          ) : (
            <div className={`h-full flex items-center justify-center ${c.bg}`}>
              <CatIcon className={`h-14 w-14 ${c.text} opacity-20`} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
          <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute top-3 right-3 h-7 w-7 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors">
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-3 left-4 right-4">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${c.bg} ${c.text} ${c.border}`}>
                <CatIcon className="h-2.5 w-2.5" />
                {receta.categoria}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${DIFIC_COLORS[receta.dificultad]}`}>
                {receta.dificultad}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white">{receta.nombre}</h2>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            {receta.tiempoPrep > 0 && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-cyan-500" />
                {receta.tiempoPrep} minutos
              </span>
            )}
            <span className="flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-amber-500" />
              <span className="flex items-center gap-0.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Star key={i} className={`h-3 w-3 ${i < stars ? "text-amber-400 fill-amber-400" : "text-slate-700"}`} />
                ))}
              </span>
            </span>
          </div>

          {receta.descripcion && (
            <p className="text-sm text-slate-300 leading-relaxed">{receta.descripcion}</p>
          )}

          {receta.notas && (
            <div className="rounded-lg bg-slate-800/60 border border-slate-700/40 p-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Notas</p>
              <p className="text-sm text-slate-400 whitespace-pre-line">{receta.notas}</p>
            </div>
          )}

          {receta.videoUrl && (
            <a
              href={receta.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg ${c.bg} border ${c.border} ${c.text} text-sm font-semibold hover:opacity-80 transition-opacity`}
            >
              <Play className="h-4 w-4" />
              Ver video de preparación
              <ExternalLink className="h-3.5 w-3.5 opacity-60" />
            </a>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function FormModal({ initial, onSave, onClose }: {
  initial: RecetaForm
  onSave: (data: RecetaForm) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<RecetaForm>(initial)

  const set = <K extends keyof RecetaForm>(key: K, value: RecetaForm[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim()) { toast.error("El nombre es requerido"); return }
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/60 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ChefHat className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-200">
              {initial.nombre ? "Editar receta" : "Nueva receta"}
            </h2>
          </div>
          <button type="button" aria-label="Cerrar" onClick={onClose} className="h-7 w-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {/* Nombre */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Nombre *</label>
            <input
              value={form.nombre}
              onChange={e => set("nombre", e.target.value)}
              placeholder="Ej: Tacos de pastor"
              className="w-full bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
            />
          </div>

          {/* Categoría */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Categoría</label>
            <div className="grid grid-cols-5 gap-1.5">
              {CATEGORIAS.filter(c => c.key !== "todas").map(cat => {
                const c = CAT_COLORS[cat.color]
                const active = form.categoria === cat.key
                const Icon = cat.icon
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => set("categoria", cat.key as Categoria)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] font-semibold transition-all ${
                      active ? `${c.bg} ${c.text} ${c.border}` : "bg-slate-800/40 border-slate-700/40 text-slate-500 hover:border-slate-600"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Descripción breve</label>
            <textarea
              value={form.descripcion}
              onChange={e => set("descripcion", e.target.value)}
              rows={2}
              placeholder="De qué trata la receta..."
              className="w-full bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 resize-none"
            />
          </div>

          {/* Video URL */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Link de video (YouTube u otro)</label>
            <input
              value={form.videoUrl}
              onChange={e => set("videoUrl", e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
            />
            {form.videoUrl && getYoutubeThumbnail(form.videoUrl) && (
              <div className="mt-1.5 rounded-lg overflow-hidden border border-slate-700/40 h-20">
                <img src={getYoutubeThumbnail(form.videoUrl)!} className="w-full h-full object-cover opacity-70" alt="preview" />
              </div>
            )}
          </div>

          {/* Tiempo + Dificultad */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="tiempo-prep" className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tiempo (min)</label>
              <input
                id="tiempo-prep"
                type="number"
                min={0}
                max={600}
                value={form.tiempoPrep}
                onChange={e => set("tiempoPrep", Number(e.target.value))}
                className="w-full bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Dificultad</label>
              <div className="flex gap-1">
                {DIFICULTADES.map(d => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => set("dificultad", d.key)}
                    className={`flex-1 py-2 rounded-lg border text-[10px] font-semibold transition-all ${
                      form.dificultad === d.key
                        ? DIFIC_COLORS[d.key]
                        : "bg-slate-800/40 border-slate-700/40 text-slate-500 hover:border-slate-600"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Notas / Ingredientes</label>
            <textarea
              value={form.notas}
              onChange={e => set("notas", e.target.value)}
              rows={3}
              placeholder="Pasos, ingredientes, tips..."
              className="w-full bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-sm font-semibold hover:bg-cyan-500/30 transition-colors"
          >
            {initial.nombre ? "Guardar cambios" : "Agregar receta"}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────
export function RecetarioView() {
  const [activeTab, setActiveTab] = useState<TabId>("recetas")
  const [recetas, setRecetas] = useState<Receta[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [categoriaFiltro, setCategoriaFiltro] = useState<Categoria | "todas">("todas")
  const [formModal, setFormModal] = useState<{ open: boolean; editando: Receta | null }>({ open: false, editando: null })
  const [detalle, setDetalle] = useState<Receta | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setRecetas(JSON.parse(raw))
    } catch {}
  }, [])

  const guardar = (lista: Receta[]) => {
    setRecetas(lista)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista))
  }

  const handleSave = (data: RecetaForm) => {
    if (formModal.editando) {
      const updated = recetas.map(r =>
        r.id === formModal.editando!.id ? { ...formModal.editando!, ...data } : r
      )
      guardar(updated)
      toast.success("Receta actualizada")
    } else {
      const nueva: Receta = { ...data, id: crypto.randomUUID(), creadoEn: new Date().toISOString() }
      guardar([...recetas, nueva])
      toast.success("Receta agregada al grimorio")
    }
    setFormModal({ open: false, editando: null })
  }

  const handleDelete = (id: string) => {
    guardar(recetas.filter(r => r.id !== id))
    toast.success("Receta eliminada")
  }

  const filtradas = useMemo(() => {
    return recetas.filter(r => {
      const matchCat = categoriaFiltro === "todas" || r.categoria === categoriaFiltro
      const matchBusq = !busqueda || r.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        r.descripcion.toLowerCase().includes(busqueda.toLowerCase())
      return matchCat && matchBusq
    })
  }, [recetas, categoriaFiltro, busqueda])

  const contPorCat = useMemo(() => {
    const map: Record<string, number> = { todas: recetas.length }
    CATEGORIAS.filter(c => c.key !== "todas").forEach(c => {
      map[c.key] = recetas.filter(r => r.categoria === c.key).length
    })
    return map
  }, [recetas])

  return (
    <div className="space-y-5 max-w-5xl mx-auto">

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-900/60 border border-slate-700/40">
        {([
          { id: "recetas",  label: "Recetario",     Icon: ChefHat,       activeClass: "bg-green-500/15 text-green-400 border-green-500/30"   },
          { id: "despensa", label: "Despensa",       Icon: Package,       activeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
          { id: "compras",  label: "Lista Compras",  Icon: ShoppingCart,  activeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30"   },
        ] as { id: TabId; label: string; Icon: React.ElementType; activeClass: string }[]).map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? tab.activeClass
                : "border-transparent text-slate-500 hover:text-slate-400"
            }`}
          >
            <tab.Icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Despensa tab ───────────────────────────────────────────────────── */}
      {activeTab === "despensa" && (
        <DespensaTab onSwitchToCompras={() => setActiveTab("compras")} />
      )}

      {/* ── Compras tab ────────────────────────────────────────────────────── */}
      {activeTab === "compras" && <ComprasTab />}

      {/* ── Recetas tab ────────────────────────────────────────────────────── */}
      {activeTab === "recetas" && <>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800/80 border border-slate-700/50 p-4 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/5 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
              <ChefHat className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100">Grimorio de Recetas</h1>
              <p className="text-[10px] text-slate-500">{recetas.length} {recetas.length === 1 ? "receta guardada" : "recetas guardadas"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFormModal({ open: true, editando: null })}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold hover:bg-green-500/20 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva receta
          </button>
        </div>
      </motion.div>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar receta..."
          className="w-full bg-slate-900/60 border border-slate-700/40 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-green-500/40 focus:ring-1 focus:ring-green-500/10"
        />
      </div>

      {/* ── Category Tabs ───────────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIAS.map(cat => {
          const c = CAT_COLORS[cat.color]
          const active = categoriaFiltro === cat.key
          const Icon = cat.icon
          const cnt = contPorCat[cat.key] ?? 0
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCategoriaFiltro(cat.key as Categoria | "todas")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-all ${
                active
                  ? `${c.bg} ${c.text} ${c.border}`
                  : "bg-slate-900/40 border-slate-700/40 text-slate-500 hover:border-slate-600 hover:text-slate-400"
              }`}
            >
              <Icon className="h-3 w-3" />
              {cat.label}
              <span className={`text-[10px] px-1 rounded ${active ? "opacity-70" : "text-slate-700"}`}>
                {cnt}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Grid ───────────────────────────────────────────────────────────── */}
      {filtradas.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <ChefHat className="h-12 w-12 text-slate-700 mb-3" />
          <p className="text-sm text-slate-500 font-medium">
            {recetas.length === 0 ? "Tu grimorio está vacío" : "Sin recetas con ese filtro"}
          </p>
          <p className="text-xs text-slate-700 mt-1">
            {recetas.length === 0 ? "Agrega tu primera receta para empezar" : "Prueba con otra categoría o búsqueda"}
          </p>
          {recetas.length === 0 && (
            <button
              type="button"
              onClick={() => setFormModal({ open: true, editando: null })}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold hover:bg-green-500/20 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar primera receta
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <AnimatePresence mode="popLayout">
            {filtradas.map(r => (
              <RecetaCard
                key={r.id}
                receta={r}
                onView={() => setDetalle(r)}
                onEdit={() => setFormModal({ open: true, editando: r })}
                onDelete={() => handleDelete(r.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {detalle && (
          <RecetaModal receta={detalle} onClose={() => setDetalle(null)} />
        )}
        {formModal.open && (
          <FormModal
            initial={formModal.editando ? { ...formModal.editando } : FORM_EMPTY}
            onSave={handleSave}
            onClose={() => setFormModal({ open: false, editando: null })}
          />
        )}
      </AnimatePresence>
      </>}

    </div>
  )
}
