"use client"

import { useState, useMemo, useRef, useCallback, useEffect, useLayoutEffect } from "react"
import { Plus, Pencil, Trash2, X, Check, Calendar as CalIcon, Tag, List, Search, ChevronLeft, ChevronRight, BarChart2, Clock, Ticket, ChevronDown, ClipboardList, Link2, ExternalLink } from "lucide-react"
import { useTheme } from "next-themes"
import { MetricasView } from "./MetricasView"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useGetTareas } from "@/api/tarea/getTareas"
import { createTarea } from "@/api/tarea/createTarea"
import { updateTarea } from "@/api/tarea/updateTarea"
import { deleteTarea } from "@/api/tarea/deleteTarea"
import { TareaType, TareaPayload, AmbitoTarea, EstadoTarea, PrioridadTarea } from "@/types/tarea"
import { useGetHistorialTarea } from "@/api/historial-tarea/getHistorialTarea"
import { createHistorialTarea } from "@/api/historial-tarea/mutateHistorialTarea"

const ESTADOS: { key: EstadoTarea | "todas"; label: string }[] = [
  { key: "todas",        label: "Todas" },
  { key: "sin_iniciar",  label: "Sin iniciar" },
  { key: "en_progreso",  label: "En progreso" },
  { key: "en_pausa",     label: "En pausa" },
  { key: "completada",   label: "Completadas" },
]

type RangoFecha = "todas" | "hoy" | "semana" | "proximos7" | "vencidas" | "sin_fecha" | "en_curso"
const RANGOS: { key: RangoFecha; label: string }[] = [
  { key: "todas",      label: "Todas las fechas" },
  { key: "en_curso",   label: "En curso hoy" },
  { key: "hoy",        label: "Vence hoy" },
  { key: "semana",     label: "Esta semana" },
  { key: "proximos7",  label: "Próx. 7 días" },
  { key: "vencidas",   label: "Vencidas" },
  { key: "sin_fecha",  label: "Sin fecha" },
]

const PRIORIDADES: PrioridadTarea[] = ["baja", "media", "alta", "urgente"]

const PRIORIDAD_COLORS: Record<PrioridadTarea, string> = {
  baja:    "bg-slate-500/10 text-slate-400 border-slate-500/20",
  media:   "bg-blue-500/10 text-blue-400 border-blue-500/20",
  alta:    "bg-amber-500/10 text-amber-400 border-amber-500/20",
  urgente: "bg-red-500/10 text-red-400 border-red-500/20",
}

const PRIORIDAD_DOT: Record<PrioridadTarea, string> = {
  baja:    "bg-slate-400",
  media:   "bg-blue-500",
  alta:    "bg-amber-500",
  urgente: "bg-red-500",
}

const ESTADO_COLORS: Record<EstadoTarea, string> = {
  sin_iniciar: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  en_progreso: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  en_pausa:    "bg-violet-500/10 text-violet-400 border-violet-500/20",
  completada:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
}

const ESTADO_LABEL: Record<EstadoTarea, string> = {
  sin_iniciar: "Sin iniciar",
  en_progreso: "En progreso",
  en_pausa:    "En pausa",
  completada:  "Completada",
}

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MESES_NOMBRES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

const fmtFecha = (iso: string | null) => {
  if (!iso) return ""
  const d = iso.includes("T") ? new Date(iso) : new Date(iso + "T00:00:00")
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" })
}

const fmtFechaHora = (iso: string) => {
  const soloFecha = !iso.includes("T")
  const d = soloFecha ? new Date(iso + "T00:00:00") : new Date(iso)
  const fecha = d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" })
  if (soloFecha) return fecha
  const hora = d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false })
  return `${fecha} ${hora}`
}

const fmtDuracion = (desde: string, hasta: string) => {
  const ms    = new Date(hasta).getTime() - (desde.includes("T") ? new Date(desde) : new Date(desde + "T00:00:00")).getTime()
  const dias  = Math.floor(ms / (1000 * 60 * 60 * 24))
  const horas = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (dias > 0 && horas > 0) return `${dias}d ${horas}h`
  if (dias > 0) return `${dias}d`
  if (horas > 0) return `${horas}h`
  return "< 1h"
}

const isoHoy = () => {
  const d = new Date(); d.setHours(0, 0, 0, 0)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

const diasHastaVencimiento = (iso: string | null): number | null => {
  if (!iso) return null
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const venc = new Date(iso + "T00:00:00")
  return Math.round((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}

// Lunes como inicio de semana ISO
const inicioSemana = (date: Date) => {
  const d = new Date(date); d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0 dom .. 6 sab
  const offset = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + offset)
  return d
}
const finSemana = (date: Date) => {
  const d = inicioSemana(date)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

type Vista = "lista" | "calendario" | "metricas"

export function TareasView({ ambito, titulo }: { ambito: AmbitoTarea; titulo: string }) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const { tareas, setTareas, loading } = useGetTareas(ambito)
  const { historial, setHistorial }    = useGetHistorialTarea(ambito)
  const [vista, setVista] = useState<Vista>("lista")
  const [filtro, setFiltro] = useState<EstadoTarea | "todas">("en_progreso")
  const [filtroEtiqueta, setFiltroEtiqueta] = useState<string>("")
  const [filtroPrioridad, setFiltroPrioridad] = useState<PrioridadTarea | "">("")
  const [filtroRango, setFiltroRango] = useState<RangoFecha>("todas")
  const [filtroResponsable, setFiltroResponsable] = useState("")
  const [filtroTicket, setFiltroTicket] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [avancesOpen, setAvancesOpen] = useState<string | null>(null)
  const [linksOpen,   setLinksOpen]   = useState<string | null>(null)
  const [mesCalendario, setMesCalendario] = useState(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<TareaType | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState<TareaPayload>({
    titulo: "", descripcion: "", ambito,
    estado: "sin_iniciar", prioridad: "media",
    etiqueta: null, fechaVencimiento: null, notas: null, responsable: null,
    area: null, fechaInicio: null, esTicket: false,
  })

  // Etiquetas únicas usadas para autocomplete
  const etiquetasUsadas = useMemo(() => {
    const set = new Set<string>()
    tareas.forEach(t => { if (t.etiqueta) set.add(t.etiqueta) })
    return [...set].sort()
  }, [tareas])

  const filtradas = useMemo(() => {
    const inicioSem = inicioSemana(new Date()).getTime()
    const finSem    = finSemana(new Date()).getTime()
    const en7 = new Date(); en7.setHours(23, 59, 59, 999); en7.setDate(en7.getDate() + 7)
    const en7Time = en7.getTime()
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    const hoyTime = hoy.getTime()
    const busq = busqueda.trim().toLowerCase()

    return tareas
      .filter(t => filtro === "todas" || t.estado === filtro)
      .filter(t => !filtroEtiqueta || t.etiqueta === filtroEtiqueta)
      .filter(t => !filtroPrioridad || t.prioridad === filtroPrioridad)
      .filter(t => !filtroResponsable || t.responsable === filtroResponsable)
      .filter(t => !filtroTicket || t.esTicket === true)
      .filter(t => {
        if (!busq) return true
        return t.titulo.toLowerCase().includes(busq) ||
               (t.descripcion ?? "").toLowerCase().includes(busq) ||
               (t.etiqueta ?? "").toLowerCase().includes(busq)
      })
      .filter(t => {
        if (filtroRango === "todas") return true
        if (filtroRango === "sin_fecha") return !t.fechaVencimiento
        if (filtroRango === "en_curso") {
          const inicio = t.fechaInicio ? new Date(t.fechaInicio + "T00:00:00").getTime() : null
          const fin    = t.fechaVencimiento ? new Date(t.fechaVencimiento + "T00:00:00").getTime() : null
          if (!inicio && !fin) return false
          const desde = inicio ?? -Infinity
          const hasta = fin ?? Infinity
          return desde <= hoyTime && hoyTime <= hasta && t.estado !== "completada"
        }
        if (!t.fechaVencimiento) return false
        const venc = new Date(t.fechaVencimiento + "T00:00:00").getTime()
        if (filtroRango === "hoy")       return venc === hoyTime
        if (filtroRango === "vencidas")  return venc < hoyTime && t.estado !== "completada"
        if (filtroRango === "semana")    return venc >= inicioSem && venc <= finSem
        if (filtroRango === "proximos7") return venc >= hoyTime && venc <= en7Time
        return true
      })
      .sort((a, b) => {
        const orden: Record<string, number> = { sin_iniciar: 0, en_progreso: 1, en_pausa: 2, completada: 3 }
        if (orden[a.estado] !== orden[b.estado]) return orden[a.estado] - orden[b.estado]
        const aVenc = a.fechaVencimiento ? new Date(a.fechaVencimiento).getTime() : Infinity
        const bVenc = b.fechaVencimiento ? new Date(b.fechaVencimiento).getTime() : Infinity
        return aVenc - bVenc
      })
  }, [tareas, filtro, filtroEtiqueta, filtroPrioridad, filtroResponsable, filtroRango, busqueda])

  const stats = {
    total:       tareas.length,
    sinIniciar:  tareas.filter(t => t.estado === "sin_iniciar").length,
    enProgreso:  tareas.filter(t => t.estado === "en_progreso").length,
    enPausa:     tareas.filter(t => t.estado === "en_pausa").length,
    completadas: tareas.filter(t => t.estado === "completada").length,
  }

  // Responsables usados para autocomplete
  const responsablesUsados = useMemo(() => {
    const s = new Set<string>()
    tareas.forEach(t => { if (t.responsable) s.add(t.responsable) })
    return [...s].sort()
  }, [tareas])

  // Áreas usadas para autocomplete
  const areasUsadas = useMemo(() => {
    const s = new Set<string>()
    tareas.forEach(t => { if (t.area) s.add(t.area) })
    return [...s].sort()
  }, [tareas])

  const abrirCrear = (fechaVencimiento: string | null = null) => {
    const hoy = isoHoy()
    setEditando(null)
    setForm({
      titulo: "", descripcion: "", ambito,
      estado: "sin_iniciar", prioridad: "media",
      etiqueta: null, fechaVencimiento: fechaVencimiento ?? hoy, notas: null, responsable: null,
      area: null, fechaInicio: hoy, esTicket: false,
    })
    setModalOpen(true)
  }

  const abrirEditar = (t: TareaType) => {
    setEditando(t)
    setForm({
      titulo: t.titulo, descripcion: t.descripcion, ambito: t.ambito,
      estado: t.estado, prioridad: t.prioridad,
      etiqueta: t.etiqueta, fechaVencimiento: t.fechaVencimiento,
      notas: t.notas, responsable: t.responsable ?? null,
      area: t.area ?? null,
      fechaInicio: t.fechaInicio ?? null,
      esTicket: t.esTicket ?? false,
    })
    setModalOpen(true)
  }

  const toggleTicket = async (t: TareaType) => {
    const nuevo = !(t.esTicket ?? false)
    setTareas(prev => prev.map(x => x.documentId === t.documentId ? { ...x, esTicket: nuevo } : x))
    try {
      await updateTarea(t.documentId, { esTicket: nuevo })
    } catch {
      setTareas(prev => prev.map(x => x.documentId === t.documentId ? { ...x, esTicket: t.esTicket } : x))
      toast.error("Error al actualizar")
    }
  }

  const guardar = async () => {
    if (!form.titulo.trim()) { toast.error("El título es obligatorio"); return }
    setGuardando(true)
    try {
      const payload: TareaPayload = { ...form }
      if (form.estado === "completada" && (!editando || editando.estado !== "completada")) {
        payload.fechaCompletada = new Date().toISOString()
      } else if (form.estado !== "completada") {
        payload.fechaCompletada = null
      }
      if (!editando) {
        payload.fechaInicio = new Date().toISOString()
      }

      if (editando) {
        const updated = await updateTarea(editando.documentId, payload)
        setTareas(prev => prev.map(t => t.documentId === updated.documentId ? updated : t))
        toast.success("Tarea actualizada")
      } else {
        const nueva = await createTarea(payload)
        setTareas(prev => [nueva, ...prev])
        toast.success("Tarea creada")
      }
      setModalOpen(false)
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  const cambiarEstado = async (t: TareaType, nuevoEstado: EstadoTarea) => {
    try {
      const ahora = new Date().toISOString()
      const payload: Partial<TareaPayload> = {
        estado: nuevoEstado,
        fechaCompletada: nuevoEstado === "completada" ? ahora : null,
        ...(!t.fechaInicio && nuevoEstado === "en_progreso" ? { fechaInicio: ahora } : {}),
      }
      const updated = await updateTarea(t.documentId, payload)
      setTareas(prev => prev.map(x => x.documentId === updated.documentId ? updated : x))
      // Log del cambio de estado — fire and forget
      createHistorialTarea({
        tareaDocumentId: t.documentId,
        estadoAnterior:  t.estado,
        estadoNuevo:     nuevoEstado,
        timestamp:       ahora,
        ambito:          t.ambito,
      }).then(entry => setHistorial(prev => [...prev, entry])).catch(() => {})
    } catch {
      toast.error("Error al actualizar")
    }
  }

  const borrar = async (t: TareaType) => {
    if (!confirm(`¿Eliminar tarea "${t.titulo}"?`)) return
    try {
      await deleteTarea(t.documentId)
      setTareas(prev => prev.filter(x => x.documentId !== t.documentId))
      toast.success("Tarea eliminada")
    } catch {
      toast.error("Error al eliminar")
    }
  }

  const actualizarProgreso = async (t: TareaType, pct: number) => {
    try {
      const updated = await updateTarea(t.documentId, { progreso: pct })
      setTareas(prev => prev.map(x => x.documentId === updated.documentId ? updated : x))
    } catch (e: any) {
      // 400 probablemente significa que el backend aún no tiene el campo progreso desplegado
      if (e?.message?.includes("400") || e?.status === 400) {
        toast.warning("El servidor aún no tiene el campo progreso. Espera el redeploy de Render.")
      } else {
        toast.error("Error al guardar progreso")
      }
    }
  }

  const agregarLink = async (t: TareaType, entrada: string) => {
    const nuevosLinks = t.links ? `${entrada}\n${t.links}` : entrada
    setTareas(prev => prev.map(x => x.documentId === t.documentId ? { ...x, links: nuevosLinks } : x))
    try {
      await updateTarea(t.documentId, { links: nuevosLinks })
      toast.success("Link guardado")
    } catch {
      setTareas(prev => prev.map(x => x.documentId === t.documentId ? { ...x, links: t.links } : x))
      toast.error("Error al guardar")
    }
  }

  const agregarAvance = async (t: TareaType, nota: string) => {
    const hoy = new Date()
    const entrada = `${hoy.getDate()} ${MESES_NOMBRES[hoy.getMonth()].slice(0, 3)} · ${nota.trim()}`
    const nuevasNotas = t.notas ? `${entrada}\n${t.notas}` : entrada
    setTareas(prev => prev.map(x => x.documentId === t.documentId ? { ...x, notas: nuevasNotas } : x))
    try {
      await updateTarea(t.documentId, { notas: nuevasNotas })
      toast.success("Avance registrado")
    } catch {
      setTareas(prev => prev.map(x => x.documentId === t.documentId ? { ...x, notas: t.notas } : x))
      toast.error("Error al guardar")
    }
  }

  // Tareas indexadas por fecha (para calendario)
  const tareasPorFecha = useMemo(() => {
    const map = new Map<string, TareaType[]>()
    tareas.forEach(t => {
      if (!t.fechaVencimiento) return
      if (!map.has(t.fechaVencimiento)) map.set(t.fechaVencimiento, [])
      map.get(t.fechaVencimiento)!.push(t)
    })
    return map
  }, [tareas])

  const limpiarFiltros = () => {
    setFiltro("todas"); setFiltroEtiqueta(""); setFiltroPrioridad(""); setFiltroRango("todas"); setBusqueda(""); setFiltroResponsable(""); setFiltroTicket(false)
  }

  const hayFiltrosActivos = filtro !== "todas" || filtroEtiqueta || filtroPrioridad || filtroRango !== "todas" || busqueda.trim() || filtroResponsable || filtroTicket

  return (
    <div
      className="-m-4 md:-m-6 min-h-[calc(100vh-3.5rem)] relative overflow-x-hidden transition-colors duration-300"
      style={{
        backgroundColor: isDark ? "#020617" : "#f8fafc",
        backgroundImage: isDark
          ? "radial-gradient(circle, #1e293b 1px, transparent 1px)"
          : "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}>
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 55% 0%, rgba(59,130,246,0.07) 0%, transparent 55%)" }} />
      <div className="relative p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{titulo}</h1>
          <p className="text-sm text-muted-foreground">Gestiona y da seguimiento a tus tareas</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle vista */}
          <div className="flex gap-1 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm p-1 rounded-lg border border-slate-200 dark:border-slate-700/50">
            <button
              type="button"
              onClick={() => setVista("lista")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                vista === "lista" ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <List size={14} /> Lista
            </button>
            <button
              type="button"
              onClick={() => setVista("calendario")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                vista === "calendario" ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <CalIcon size={14} /> Calendario
            </button>
            <button
              type="button"
              onClick={() => setVista("metricas")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                vista === "metricas" ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <BarChart2 size={14} /> Métricas
            </button>
          </div>
          <Button onClick={() => abrirCrear()} size="sm">
            <Plus size={14} className="mr-1" />
            <span className="hidden sm:inline">Nueva tarea</span>
            <span className="sm:hidden">Nueva</span>
          </Button>
        </div>
      </div>


      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        <div className="border border-slate-200 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground uppercase">Total</p>
          <p className="text-xl font-bold">{stats.total}</p>
        </div>
        <div className="border border-slate-200 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase">Sin iniciar</p>
          <p className="text-xl font-bold text-slate-300">{stats.sinIniciar}</p>
        </div>
        <div className="border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm rounded-xl p-3">
          <p className="text-[10px] text-blue-400 uppercase">En progreso</p>
          <p className="text-xl font-bold text-blue-300">{stats.enProgreso}</p>
        </div>
        <div className="border border-violet-500/30 bg-violet-500/10 backdrop-blur-sm rounded-xl p-3">
          <p className="text-[10px] text-violet-400 uppercase">En pausa</p>
          <p className="text-xl font-bold text-violet-300">{stats.enPausa}</p>
        </div>
        <div className="border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-sm rounded-xl p-3">
          <p className="text-[10px] text-emerald-400 uppercase">Completadas</p>
          <p className="text-xl font-bold text-emerald-300">{stats.completadas}</p>
        </div>
      </div>

      {/* Filtros (solo en vista lista) */}
      {vista === "lista" && (
        <div className="space-y-3 mb-6 mt-2">
          {/* Búsqueda */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por título, descripción o etiqueta..."
              className="h-9 pl-9 text-sm bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600"
            />
          </div>

          {/* Filtros en línea */}
          <div className="flex items-center gap-2 flex-wrap">
            {ESTADOS.map(e => (
              <button
                key={e.key}
                type="button"
                onClick={() => setFiltro(e.key)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  filtro === e.key
                    ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                {e.label}
              </button>
            ))}

            <select
              title="Filtrar por rango de fecha"
              value={filtroRango}
              onChange={e => setFiltroRango(e.target.value as RangoFecha)}
              className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              {RANGOS.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>

            <select
              title="Filtrar por prioridad"
              value={filtroPrioridad}
              onChange={e => setFiltroPrioridad(e.target.value as PrioridadTarea | "")}
              className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="">Toda prioridad</option>
              {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            {etiquetasUsadas.length > 0 && (
              <select
                title="Filtrar por etiqueta"
                value={filtroEtiqueta}
                onChange={e => setFiltroEtiqueta(e.target.value)}
                className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <option value="">Todas las etiquetas</option>
                {etiquetasUsadas.map(et => <option key={et} value={et}>{et}</option>)}
              </select>
            )}

            {responsablesUsados.length > 0 && (
              <select
                title="Filtrar por responsable"
                value={filtroResponsable}
                onChange={e => setFiltroResponsable(e.target.value)}
                className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <option value="">Todos los responsables</option>
                {responsablesUsados.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            )}

            <button
              type="button"
              onClick={() => setFiltroTicket(v => !v)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                filtroTicket
                  ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
                  : "bg-slate-800 border-slate-700 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Ticket size={11} /> Solo tickets
            </button>

            {hayFiltrosActivos && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="text-xs px-2 py-1.5 text-muted-foreground hover:text-foreground"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}

      {/* VISTA: LISTA */}
      {vista === "lista" && (
        loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
        ) : filtradas.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {tareas.length === 0 ? "No hay tareas. Crea una." : "Sin resultados con los filtros actuales."}
          </p>
        ) : (
          <div className="space-y-2">
            {filtradas.map(t => {
              const dias = diasHastaVencimiento(t.fechaVencimiento)
              const vencida = dias !== null && dias < 0 && t.estado !== "completada"
              const proxima = dias !== null && dias >= 0 && dias <= 2 && t.estado !== "completada"

              return (
                <div
                  key={t.documentId}
                  className={`flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm ${t.estado === "completada" ? "opacity-50" : ""}`}
                >
                  <button
                    type="button"
                    title={t.estado === "completada" ? "Marcar como sin iniciar" : "Marcar como completada"}
                    onClick={() => cambiarEstado(t, t.estado === "completada" ? "sin_iniciar" : "completada")}
                    className={`mt-0.5 h-5 w-5 rounded border-2 shrink-0 flex items-center justify-center transition ${
                      t.estado === "completada"
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-zinc-300 dark:border-zinc-600 hover:border-emerald-500"
                    }`}
                  >
                    {t.estado === "completada" && <Check size={12} className="text-white" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium ${t.estado === "completada" ? "line-through text-muted-foreground" : ""}`}>
                        {t.titulo}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          title={t.esTicket ? "Quitar ticket de servicio" : "Marcar como ticket de servicio"}
                          onClick={() => toggleTicket(t)}
                          className={`p-1 rounded transition-colors ${
                            t.esTicket
                              ? "text-blue-500 dark:text-blue-400 hover:text-blue-600"
                              : "text-muted-foreground/30 hover:text-blue-400"
                          }`}
                        >
                          <Ticket size={12} />
                        </button>
                        <button type="button" title="Editar" onClick={() => abrirEditar(t)} className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted">
                          <Pencil size={12} />
                        </button>
                        <button type="button" title="Eliminar" onClick={() => borrar(t)} className="p-1 text-muted-foreground hover:text-red-500 rounded hover:bg-muted">
                          <Trash2 size={12} />
                        </button>
                        <button
                          type="button"
                          title="Agregar link"
                          onClick={() => setLinksOpen(prev => prev === t.documentId ? null : t.documentId)}
                          className={`p-1 rounded transition-colors ${
                            linksOpen === t.documentId
                              ? "text-blue-400 hover:text-blue-500"
                              : t.links
                              ? "text-blue-400/60 hover:text-blue-400"
                              : "text-muted-foreground/40 hover:text-blue-400"
                          }`}
                        >
                          <Link2 size={12} />
                        </button>
                        <button
                          type="button"
                          title="Anotar avance"
                          onClick={() => setAvancesOpen(prev => prev === t.documentId ? null : t.documentId)}
                          className={`p-1 rounded transition-colors ${
                            avancesOpen === t.documentId
                              ? "text-violet-400 hover:text-violet-500"
                              : "text-muted-foreground/40 hover:text-violet-400"
                          }`}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    {t.descripcion && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.descripcion}</p>
                    )}

                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {t.esTicket && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400 inline-flex items-center gap-1">
                          <Ticket size={9} /> Ticket
                        </span>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${ESTADO_COLORS[t.estado]}`}>
                        {ESTADO_LABEL[t.estado]}
                      </span>
                      {t.prioridad !== "media" && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${PRIORIDAD_COLORS[t.prioridad]}`}>
                          {t.prioridad}
                        </span>
                      )}
                      {t.etiqueta && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-violet-200 dark:border-violet-900/40 bg-violet-50/40 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 inline-flex items-center gap-1">
                          <Tag size={9} />
                          {t.etiqueta}
                        </span>
                      )}
                      {t.fechaVencimiento && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border inline-flex items-center gap-1 ${
                          vencida ? "border-red-300 bg-red-50 dark:bg-red-950/20 text-red-500"
                          : proxima ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20 text-amber-500"
                          : "border-slate-700/50 text-muted-foreground"
                        }`}>
                          <CalIcon size={9} />
                          {fmtFecha(t.fechaVencimiento)}
                          {dias !== null && t.estado !== "completada" && (
                            dias === 0 ? " · hoy"
                            : dias < 0 ? ` · vencida ${-dias}d`
                            : dias <= 7 ? ` · en ${dias}d`
                            : ""
                          )}
                        </span>
                      )}
                    </div>

                    {(t.responsable || t.area || t.fechaInicio || t.fechaCompletada || t.ticket) && (
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {t.responsable && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            {t.responsable}
                          </span>
                        )}
                        {t.area && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-muted-foreground">
                            {t.area}
                          </span>
                        )}
                        {t.estado === "completada" && t.fechaCompletada ? (
                          <span className="text-[10px] flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <Check size={9} />
                            {t.fechaInicio && <>{fmtFechaHora(t.fechaInicio)} → </>}
                            {fmtFechaHora(t.fechaCompletada)}
                            {t.fechaInicio && (
                              <> · {fmtDuracion(t.fechaInicio, t.fechaCompletada)}</>
                            )}
                          </span>
                        ) : (t.fechaInicio || t.createdAt) ? (
                          <span className="text-[10px] flex items-center gap-1 text-muted-foreground">
                            <Clock size={9} />
                            {fmtFechaHora(t.createdAt ?? t.fechaInicio!)}
                            {t.fechaVencimiento && (
                              <> → {fmtFecha(t.fechaVencimiento)}</>
                            )}
                          </span>
                        ) : null}
                        {t.ticket && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400">
                            🎫 {t.ticket.titulo}
                          </span>
                        )}
                      </div>
                    )}

                    <ProgresoBar
                      value={t.progreso ?? 0}
                      onSave={pct => actualizarProgreso(t, pct)}
                    />
                    <LinksPanel
                      links={t.links}
                      inputOpen={linksOpen === t.documentId}
                      onAgregar={entrada => agregarLink(t, entrada)}
                    />
                    <AvancesPanel
                      notas={t.notas}
                      inputOpen={avancesOpen === t.documentId}
                      onAgregar={nota => agregarAvance(t, nota)}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* VISTA: CALENDARIO */}
      {vista === "calendario" && (
        <CalendarioVista
          mes={mesCalendario}
          setMes={setMesCalendario}
          tareasPorFecha={tareasPorFecha}
          onClickDia={fechaIso => abrirCrear(fechaIso)}
          onClickTarea={t => abrirEditar(t)}
        />
      )}

      {/* VISTA: MÉTRICAS */}
      {vista === "metricas" && (
        <MetricasView tareas={tareas} historial={historial} />
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 sm:p-6 w-full max-w-md space-y-3 border border-slate-700/50 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editando ? "Editar tarea" : "Nueva tarea"}</h2>
              <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
                <X size={16} />
              </Button>
            </div>

            <div>
              <Label className="text-xs" htmlFor="t-titulo">Título *</Label>
              <Input id="t-titulo" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} className="h-9" placeholder="Ej. Revisar propuesta" />
            </div>

            <div>
              <Label className="text-xs" htmlFor="t-desc">Descripción</Label>
              <textarea
                id="t-desc"
                value={form.descripcion ?? ""}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value || null }))}
                className="w-full min-h-[60px] text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2"
                placeholder="Detalles, contexto..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs" htmlFor="t-estado">Estado</Label>
                <select
                  id="t-estado"
                  aria-label="Estado de la tarea"
                  value={form.estado}
                  onChange={e => setForm(f => ({ ...f, estado: e.target.value as EstadoTarea }))}
                  className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm"
                >
                  <option value="sin_iniciar">Sin iniciar</option>
                  <option value="en_progreso">En progreso</option>
                  <option value="en_pausa">En pausa</option>
                  <option value="completada">Completada</option>
                </select>
              </div>
              <div>
                <Label className="text-xs" htmlFor="t-prio">Prioridad</Label>
                <select
                  id="t-prio"
                  aria-label="Prioridad"
                  value={form.prioridad}
                  onChange={e => setForm(f => ({ ...f, prioridad: e.target.value as PrioridadTarea }))}
                  className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm"
                >
                  {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs" htmlFor="t-inicio">
                  Fecha inicio {!editando && <span className="text-muted-foreground font-normal">(auto)</span>}
                </Label>
                {editando ? (
                  <div className="h-9 flex items-center px-3 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-muted-foreground">
                    {form.fechaInicio ? fmtFechaHora(form.fechaInicio) : "—"}
                  </div>
                ) : (
                  <div className="h-9 flex items-center px-3 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-muted-foreground">
                    Ahora (automático)
                  </div>
                )}
              </div>
              <div>
                <Label className="text-xs" htmlFor="t-fecha">Fecha límite</Label>
                <Input
                  id="t-fecha"
                  type="date"
                  value={form.fechaVencimiento ?? ""}
                  onChange={e => setForm(f => ({ ...f, fechaVencimiento: e.target.value || null }))}
                  className="h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs" htmlFor="t-responsable">Responsable</Label>
                <Input
                  id="t-responsable"
                  list="responsables-tarea"
                  value={form.responsable ?? ""}
                  onChange={e => setForm(f => ({ ...f, responsable: e.target.value || null }))}
                  placeholder="Quién la realiza"
                  className="h-9"
                />
                <datalist id="responsables-tarea">
                  {responsablesUsados.map(r => <option key={r} value={r} />)}
                </datalist>
              </div>
              <div>
                <Label className="text-xs" htmlFor="t-area">Área de solicitud</Label>
                <Input
                  id="t-area"
                  list="areas-tarea"
                  value={form.area ?? ""}
                  onChange={e => setForm(f => ({ ...f, area: e.target.value || null }))}
                  placeholder="Diseño, Marketing..."
                  className="h-9"
                />
                <datalist id="areas-tarea">
                  {areasUsadas.map(a => <option key={a} value={a} />)}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs" htmlFor="t-etiqueta">Etiqueta</Label>
                <Input
                  id="t-etiqueta"
                  list="etiquetas-tarea"
                  value={form.etiqueta ?? ""}
                  onChange={e => setForm(f => ({ ...f, etiqueta: e.target.value || null }))}
                  placeholder="campaña, urgente..."
                  className="h-9"
                />
                <datalist id="etiquetas-tarea">
                  {etiquetasUsadas.map(et => <option key={et} value={et} />)}
                </datalist>
              </div>
              <div>
                <Label className="text-xs" htmlFor="t-notas">Notas</Label>
                <Input
                  id="t-notas"
                  value={form.notas ?? ""}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value || null }))}
                  placeholder="Notas adicionales..."
                  className="h-9"
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.esTicket ?? false}
                onChange={e => setForm(f => ({ ...f, esTicket: e.target.checked }))}
                className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 accent-blue-500"
              />
              <span className="text-sm flex items-center gap-1.5 text-muted-foreground">
                <Ticket size={13} className="text-blue-400" />
                Es ticket de servicio
              </span>
            </label>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button size="sm" onClick={guardar} disabled={guardando}>
                <Check size={14} className="mr-1" />
                {guardando ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

// ─── Barra de progreso arrastrable ───────────────────────────────────────────

function ProgresoBar({ value, onSave }: { value: number; onSave: (pct: number) => void }) {
  const [local, setLocal] = useState(value)
  const dragging = useRef(false)
  const barRef  = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const onSaveRef = useRef(onSave)
  useEffect(() => { onSaveRef.current = onSave }, [onSave])
  useEffect(() => { if (!dragging.current) setLocal(value) }, [value])

  // Set fill width via DOM to avoid inline-style JSX lint warning
  useLayoutEffect(() => {
    if (fillRef.current) fillRef.current.style.width = `${local}%`
  }, [local])

  const calcPct = useCallback((clientX: number) => {
    if (!barRef.current) return 0
    const { left, width } = barRef.current.getBoundingClientRect()
    return Math.min(Math.max(Math.round((clientX - left) / width * 100), 0), 100)
  }, [])

  useEffect(() => {
    const onMove  = (e: MouseEvent) => { if (dragging.current) setLocal(calcPct(e.clientX)) }
    const onUp    = (e: MouseEvent) => {
      if (!dragging.current) return
      const pct = calcPct(e.clientX); setLocal(pct); dragging.current = false; onSaveRef.current(pct)
    }
    const onTMove = (e: TouchEvent) => { if (dragging.current) { e.preventDefault(); setLocal(calcPct(e.touches[0].clientX)) } }
    const onTEnd  = (e: TouchEvent) => {
      if (!dragging.current) return
      const pct = calcPct(e.changedTouches[0].clientX); setLocal(pct); dragging.current = false; onSaveRef.current(pct)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup",   onUp)
    window.addEventListener("touchmove", onTMove, { passive: false })
    window.addEventListener("touchend",  onTEnd)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup",   onUp)
      window.removeEventListener("touchmove", onTMove)
      window.removeEventListener("touchend",  onTEnd)
    }
  }, [calcPct])

  const color = local >= 100 ? "bg-emerald-500" : local >= 60 ? "bg-blue-500" : local >= 30 ? "bg-amber-500" : "bg-red-400"

  return (
    <div className="flex items-center gap-2 mt-2">
      <div
        ref={barRef}
        onMouseDown={e => { e.preventDefault(); dragging.current = true; setLocal(calcPct(e.clientX)) }}
        onTouchStart={e => { dragging.current = true; setLocal(calcPct(e.touches[0].clientX)) }}
        aria-label={`Progreso ${local}%`}
        className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full cursor-pointer select-none"
      >
        <div ref={fillRef} className={`h-full rounded-full ${color}`} />
      </div>
      <span className={`text-[10px] font-mono w-8 text-right shrink-0 tabular-nums ${local >= 100 ? "text-emerald-500" : "text-muted-foreground"}`}>
        {local}%
      </span>
    </div>
  )
}

// ─── Panel de links ──────────────────────────────────────────────────────────

function LinksPanel({ links, inputOpen, onAgregar }: {
  links: string | null
  inputOpen: boolean
  onAgregar: (entrada: string) => Promise<void>
}) {
  const [urlInput,   setUrlInput]   = useState("")
  const [labelInput, setLabelInput] = useState("")
  const [guardando,  setGuardando]  = useState(false)

  const entradas = links ? links.split("\n").filter(Boolean) : []

  const enviar = async () => {
    const url = urlInput.trim()
    if (!url) return
    const entrada = labelInput.trim() ? `${labelInput.trim()} · ${url}` : url
    setGuardando(true)
    await onAgregar(entrada)
    setUrlInput("")
    setLabelInput("")
    setGuardando(false)
  }

  const parseEntrada = (e: string) => {
    const sep = e.indexOf(" · ")
    if (sep !== -1) return { label: e.slice(0, sep), url: e.slice(sep + 3) }
    return { label: null, url: e }
  }

  const dominio = (url: string) => { try { return new URL(url).hostname.replace("www.", "") } catch { return url.slice(0, 30) } }

  if (entradas.length === 0 && !inputOpen) return null

  return (
    <div className="mt-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60">
      {entradas.length > 0 && (
        <div className="space-y-1 mb-2">
          {entradas.map((e, i) => {
            const { label, url } = parseEntrada(e)
            return (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] text-blue-500 hover:text-blue-400 transition w-fit max-w-full">
                <ExternalLink size={10} className="shrink-0" />
                <span className="truncate">{label ?? dominio(url)}</span>
              </a>
            )
          })}
        </div>
      )}
      {inputOpen && (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <Input
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="https://..."
              className="h-7 text-xs flex-1"
              onKeyDown={e => { if (e.key === "Enter") enviar() }}
              autoFocus
            />
            <Input
              value={labelInput}
              onChange={e => setLabelInput(e.target.value)}
              placeholder="Etiqueta (opcional)"
              className="h-7 text-xs w-32"
              onKeyDown={e => { if (e.key === "Enter") enviar() }}
            />
            <button
              type="button"
              onClick={enviar}
              disabled={guardando || !urlInput.trim()}
              className="h-7 px-2.5 text-xs rounded-md bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-500 transition shrink-0"
            >
              {guardando ? "..." : "Guardar"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Panel de avances ────────────────────────────────────────────────────────

function AvancesPanel({ notas, inputOpen, onAgregar }: {
  notas: string | null
  inputOpen: boolean
  onAgregar: (nota: string) => Promise<void>
}) {
  const [input, setInput] = useState("")
  const [guardando, setGuardando] = useState(false)

  const entradas = notas ? notas.split("\n").filter(Boolean) : []

  const enviar = async () => {
    if (!input.trim()) return
    setGuardando(true)
    await onAgregar(input.trim())
    setInput("")
    setGuardando(false)
  }

  if (entradas.length === 0 && !inputOpen) return null

  return (
    <div className="mt-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60">
      {entradas.length > 0 && (
        <div className="space-y-1 mb-2">
          {entradas.map((entrada, i) => {
            const sepIdx = entrada.indexOf(" · ")
            const fecha = sepIdx !== -1 ? entrada.slice(0, sepIdx) : ""
            const texto = sepIdx !== -1 ? entrada.slice(sepIdx + 3) : entrada
            return (
              <div key={i} className="flex gap-2 items-baseline">
                {fecha && (
                  <span className="text-[10px] text-muted-foreground/60 shrink-0 min-w-[44px] font-mono">
                    {fecha}
                  </span>
                )}
                <p className="text-[11px] text-muted-foreground leading-snug">{texto}</p>
              </div>
            )
          })}
        </div>
      )}
      {inputOpen && (
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Anotar avance o pendiente..."
            className="h-7 text-xs flex-1"
            onKeyDown={e => { if (e.key === "Enter") enviar() }}
            autoFocus
          />
          <button
            type="button"
            onClick={enviar}
            disabled={guardando || !input.trim()}
            className="h-7 px-2.5 text-xs rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 disabled:opacity-40 hover:opacity-80 transition shrink-0"
          >
            {guardando ? "..." : "Anotar"}
          </button>
        </div>
      )}
    </div>
  )
}

function CalendarioVista({
  mes, setMes, tareasPorFecha, onClickDia, onClickTarea,
}: {
  mes: Date
  setMes: (d: Date) => void
  tareasPorFecha: Map<string, TareaType[]>
  onClickDia: (fechaIso: string) => void
  onClickTarea: (t: TareaType) => void
}) {
  const año = mes.getFullYear()
  const mesNum = mes.getMonth()
  const primerDia = new Date(año, mesNum, 1)
  const offsetInicio = primerDia.getDay() // 0 = dom
  const diasMes = new Date(año, mesNum + 1, 0).getDate()
  const hoyIso = isoHoy()

  const celdas: (string | null)[] = []
  for (let i = 0; i < offsetInicio; i++) celdas.push(null)
  for (let d = 1; d <= diasMes; d++) {
    celdas.push(`${año}-${String(mesNum + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`)
  }
  while (celdas.length % 7 !== 0) celdas.push(null)

  return (
    <div className="border border-slate-200 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl p-3">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setMes(new Date(año, mesNum - 1, 1))}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
          title="Mes anterior"
        >
          <ChevronLeft size={16} />
        </button>
        <h3 className="text-sm font-semibold capitalize">{MESES_NOMBRES[mesNum]} {año}</h3>
        <button
          type="button"
          onClick={() => setMes(new Date(año, mesNum + 1, 1))}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
          title="Mes siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DIAS_SEMANA.map(d => (
          <div key={d} className="text-[10px] text-muted-foreground text-center font-medium uppercase">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {celdas.map((iso, i) => {
          if (!iso) return <div key={i} className="min-h-[72px]" />
          const ts = tareasPorFecha.get(iso) ?? []
          const esHoy = iso === hoyIso
          const dia = parseInt(iso.split("-")[2], 10)
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onClickDia(iso)}
              className={`min-h-[72px] p-1 rounded border text-left flex flex-col gap-0.5 transition ${
                esHoy
                  ? "border-cyan-500/60 bg-cyan-500/10"
                  : "border-slate-200 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              }`}
              title={`Crear tarea el ${iso}`}
            >
              <span className={`text-[10px] font-semibold ${esHoy ? "text-cyan-600 dark:text-cyan-400" : "text-muted-foreground"}`}>
                {dia}
              </span>
              <div className="flex-1 space-y-0.5 overflow-hidden">
                {ts.slice(0, 3).map(t => (
                  <div
                    key={t.documentId}
                    onClick={e => { e.stopPropagation(); onClickTarea(t) }}
                    className={`text-[9px] truncate px-1 py-0.5 rounded border cursor-pointer hover:opacity-80 ${
                      t.estado === "completada"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 line-through"
                        : t.prioridad === "urgente"
                        ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                        : t.prioridad === "alta"
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                        : "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {t.titulo}
                  </div>
                ))}
                {ts.length > 3 && (
                  <div className="text-[9px] text-muted-foreground pl-1">+{ts.length - 3}</div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
