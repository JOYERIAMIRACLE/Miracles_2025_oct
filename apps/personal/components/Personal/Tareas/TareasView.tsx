"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Plus, Trash2, X, Check, Calendar as CalIcon, Tag, List, Search, ChevronLeft, ChevronRight, BarChart2, Ticket, ChevronDown, Link2, ExternalLink, SlidersHorizontal, Layers, Pencil } from "lucide-react"
import { useTheme } from "next-themes"
import { MetricasView } from "./MetricasView"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { DropdownPicker } from "@/components/Shared/DropdownPicker"
import { useModalBackdropClose } from "@/components/Shared/useModalBackdropClose"
import { fieldCls } from "@/lib/styles"
import { useCurrentUser } from "@/lib/useCurrentUser"
import { useGetTareas } from "@/api/tarea/getTareas"
import { createTarea } from "@/api/tarea/createTarea"
import { updateTarea } from "@/api/tarea/updateTarea"
import { deleteTarea } from "@/api/tarea/deleteTarea"
import { TareaType, TareaPayload, AmbitoTarea, EstadoTarea, PrioridadTarea } from "@/types/tarea"
import { useGetHistorialTarea } from "@/api/historial-tarea/getHistorialTarea"
import { createHistorialTarea } from "@/api/historial-tarea/mutateHistorialTarea"
import { createProyecto, updateProyecto } from "@/api/proyecto/mutateProyecto"
import { ProgresoBar, AvancesPanel } from "@/components/Shared/TareasWidgets"

type ProyectoRef = NonNullable<TareaType["proyecto"]>

// Los desplegables del modal (Estado/Prioridad/Responsable/Área/Etiqueta) son
// paneles "position: absolute", así que no quedan incluidos en el bounding
// box de su contenedor — si el modal tiene scroll, el panel puede quedar
// cortado abajo. Este ref hace que el panel se desplace a la vista al abrir.
function useAutoScrollPanel(open: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (open) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [open])
  return ref
}

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
const PRIORIDAD_LABEL: Record<PrioridadTarea, string> = { baja: "Baja", media: "Media", alta: "Alta", urgente: "Urgente" }

const PRIORIDAD_COLORS: Record<PrioridadTarea, string> = {
  baja:    "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700",
  media:   "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700",
  alta:    "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50",
  urgente: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50",
}

const ESTADO_COLORS: Record<EstadoTarea, string> = {
  sin_iniciar: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700",
  en_progreso: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50",
  en_pausa:    "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800/50",
  completada:  "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50",
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

// Default de "Fecha límite" al crear: una semana después de hoy.
const unaSemanaDespues = (iso: string): string => {
  const d = new Date(iso + "T00:00:00")
  d.setDate(d.getDate() + 7)
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
  const { user } = useCurrentUser()
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
    etiqueta: null, fechaVencimiento: null, notas: null, links: null, responsable: null,
    area: null, fechaInicio: null, esTicket: false,
  })
  const cerrarModalSiVacio = useModalBackdropClose(form, () => setModalOpen(false), modalOpen)

  const [estadoOpen,  setEstadoOpen]  = useState(false)
  const [filtrosOpen, setFiltrosOpen] = useState(false)
  const estadoRef  = useRef<HTMLDivElement>(null)
  const filtrosRef = useRef<HTMLDivElement>(null)
  // Dropdowns del modal
  const [atributosOpen, setAtributosOpen] = useState(false)
  const [estadoFieldOpen,    setEstadoFieldOpen]    = useState(false)
  const [prioridadFieldOpen, setPrioridadFieldOpen] = useState(false)
  const [respOpen,  setRespOpen]  = useState(false)
  const [respQuery, setRespQuery] = useState("")
  const [etqOpen,   setEtqOpen]   = useState(false)
  const [etqQuery,  setEtqQuery]  = useState("")
  const [areaOpen,  setAreaOpen]  = useState(false)
  const [areaQuery, setAreaQuery] = useState("")
  const estadoFieldRef    = useRef<HTMLDivElement>(null)
  const prioridadFieldRef = useRef<HTMLDivElement>(null)
  const respRef = useRef<HTMLDivElement>(null)
  const etqRef  = useRef<HTMLDivElement>(null)
  const areaRef = useRef<HTMLDivElement>(null)
  const estadoPanelRef    = useAutoScrollPanel(estadoFieldOpen)
  const prioridadPanelRef = useAutoScrollPanel(prioridadFieldOpen)
  const respPanelRef      = useAutoScrollPanel(respOpen)
  const etqPanelRef       = useAutoScrollPanel(etqOpen)
  const areaPanelRef      = useAutoScrollPanel(areaOpen)

  // Agrupar tareas arrastrando una sobre otra: comparten la relación real
  // "proyecto" (misma colección que ya existe en el backend, sin UI propia
  // todavía) — quien recibe el drop se conecta al proyecto de la otra si ya
  // tenía uno; si ninguna tiene, se pide un nombre y se crea el proyecto.
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [agruparPorProyecto, setAgruparPorProyecto] = useState(true)
  const [proyectosColapsados, setProyectosColapsados] = useState<Set<string>>(new Set())
  const [nombrandoProyecto, setNombrandoProyecto] = useState<{ origenId: string; destinoId: string } | null>(null)
  const [nombreProyectoInput, setNombreProyectoInput] = useState("")
  const [renombrandoProyecto, setRenombrandoProyecto] = useState<string | null>(null) // documentId del proyecto
  const [nombreRenombrado, setNombreRenombrado] = useState("")

  // Etiquetas/responsables/áreas usados — se derivan de las tareas ya
  // existentes (no hay un catálogo genérico separado en este proyecto), así
  // que cualquier valor nuevo queda disponible para autocompletar en cuanto
  // se usa una vez.
  const etiquetasUsadas = useMemo(() => {
    const set = new Set<string>()
    tareas.forEach(t => { if (t.etiqueta) set.add(t.etiqueta) })
    return [...set].sort()
  }, [tareas])

  // El catálogo se deriva de las tareas ya usadas — si es la primera vez que
  // el usuario en sesión aparece como responsable (ver default de abajo), su
  // nombre todavía no está ahí. Sin esto, el filtro seguiría funcionando por
  // dentro pero el desplegable mostraría "Todos", dando la impresión de que
  // no hay ningún filtro activo.
  const responsablesUsados = useMemo(() => {
    const set = new Set<string>()
    tareas.forEach(t => { if (t.responsable) set.add(t.responsable) })
    const base = [...set].sort()
    return user?.username && !base.includes(user.username) ? [user.username, ...base] : base
  }, [tareas, user])

  const areasUsadas = useMemo(() => {
    const set = new Set<string>()
    tareas.forEach(t => { if (t.area) set.add(t.area) })
    return [...set].sort()
  }, [tareas])

  // Al entrar a la vista, el filtro de Responsable arranca en el usuario con
  // la sesión iniciada (así cada quien ve sus propias tareas por default) —
  // sigue siendo un filtro normal, se puede cambiar o limpiar después.
  useEffect(() => {
    if (user?.username) setFiltroResponsable(user.username)
  }, [user])

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
  }, [tareas, filtro, filtroEtiqueta, filtroPrioridad, filtroResponsable, filtroRango, busqueda, filtroTicket])

  // Agrupa la lista ya filtrada/ordenada por la relación "proyecto" (arrastrar
  // una tarea sobre otra las agrupa, ver handleDropTarea) — las tareas de un
  // mismo proyecto se juntan bajo un encabezado colapsable en la posición de
  // la primera que aparece; las sueltas se quedan igual que antes. Toggle
  // solo de vista — no toca el campo "proyecto" de ninguna tarea.
  type GrupoTareas = { tipo: "proyecto"; proyecto: ProyectoRef; tareas: TareaType[] } | { tipo: "suelta"; tarea: TareaType }
  const gruposRenderizados = useMemo<GrupoTareas[]>(() => {
    if (!agruparPorProyecto) {
      return filtradas.map(t => ({ tipo: "suelta" as const, tarea: t }))
    }
    const vistos = new Set<string>()
    const resultado: GrupoTareas[] = []
    for (const t of filtradas) {
      const proyecto = t.proyecto
      if (proyecto) {
        if (vistos.has(proyecto.documentId)) continue
        vistos.add(proyecto.documentId)
        resultado.push({ tipo: "proyecto", proyecto, tareas: filtradas.filter(x => x.proyecto?.documentId === proyecto.documentId) })
      } else {
        resultado.push({ tipo: "suelta", tarea: t })
      }
    }
    return resultado
  }, [filtradas, agruparPorProyecto])

  const stats = {
    total:       tareas.length,
    sinIniciar:  tareas.filter(t => t.estado === "sin_iniciar").length,
    enProgreso:  tareas.filter(t => t.estado === "en_progreso").length,
    enPausa:     tareas.filter(t => t.estado === "en_pausa").length,
    completadas: tareas.filter(t => t.estado === "completada").length,
  }

  const abrirCrear = (fechaVencimiento: string | null = null) => {
    const hoy = isoHoy()
    setEditando(null)
    setForm({
      titulo: "", descripcion: "", ambito,
      estado: "en_progreso", prioridad: "media",
      etiqueta: null, fechaVencimiento: fechaVencimiento ?? unaSemanaDespues(hoy), notas: null, links: null,
      responsable: user?.username ?? null, area: null, fechaInicio: hoy, esTicket: false,
    })
    setModalOpen(true)
  }

  const abrirEditar = (t: TareaType) => {
    setEditando(t)
    setForm({
      titulo: t.titulo, descripcion: t.descripcion, ambito: t.ambito,
      estado: t.estado, prioridad: t.prioridad,
      etiqueta: t.etiqueta, fechaVencimiento: t.fechaVencimiento,
      notas: t.notas, links: t.links, responsable: t.responsable ?? null,
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
      if (e?.message?.includes("400") || e?.status === 400) {
        toast.warning("El servidor aún no tiene el campo progreso. Espera el redeploy de Railway.")
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

  // Conecta origen y destino a un proyecto ya existente (nuevo o reusado) —
  // reusada tanto por confirmarNombrarProyecto (proyecto recién creado) como
  // por handleDropTarea (proyecto que ya tenía alguna de las dos tareas).
  const asignarProyectoExistente = async (origenId: string, destinoId: string, proyecto: ProyectoRef) => {
    const origen  = tareas.find(t => t.documentId === origenId)
    const destino = tareas.find(t => t.documentId === destinoId)
    const prevOrigen  = origen?.proyecto  ?? null
    const prevDestino = destino?.proyecto ?? null
    setTareas(prev => prev.map(t => (t.documentId === origenId || t.documentId === destinoId) ? { ...t, proyecto } : t))
    try {
      await Promise.all([
        prevOrigen?.documentId  !== proyecto.documentId ? updateTarea(origenId,  { proyecto: { connect: [{ id: proyecto.id }] } }) : Promise.resolve(),
        prevDestino?.documentId !== proyecto.documentId ? updateTarea(destinoId, { proyecto: { connect: [{ id: proyecto.id }] } }) : Promise.resolve(),
      ])
      toast.success(`Agrupadas en "${proyecto.nombre}"`)
    } catch {
      setTareas(prev => prev.map(t =>
        t.documentId === origenId  ? { ...t, proyecto: prevOrigen }
        : t.documentId === destinoId ? { ...t, proyecto: prevDestino }
        : t
      ))
      toast.error("Error al agrupar")
    }
  }

  function handleDropTarea(destino: TareaType) {
    const origenId = dragId
    setDragId(null); setDragOverId(null)
    if (!origenId || origenId === destino.documentId) return
    const origen = tareas.find(t => t.documentId === origenId)
    if (!origen) return
    const proyectoExistente = destino.proyecto ?? origen.proyecto
    if (proyectoExistente) {
      asignarProyectoExistente(origenId, destino.documentId, proyectoExistente)
    } else {
      setNombreProyectoInput("")
      setNombrandoProyecto({ origenId, destinoId: destino.documentId })
    }
  }

  async function confirmarNombrarProyecto() {
    if (!nombrandoProyecto || !nombreProyectoInput.trim()) return
    const { origenId, destinoId } = nombrandoProyecto
    setNombrandoProyecto(null)
    try {
      const nuevo = await createProyecto({ nombre: nombreProyectoInput.trim() })
      await asignarProyectoExistente(origenId, destinoId, { id: nuevo.id, documentId: nuevo.documentId, nombre: nuevo.nombre })
    } catch {
      toast.error("Error al crear el proyecto")
    }
  }

  function quitarDeProyecto(t: TareaType) {
    if (!t.proyecto) return
    const prev = t.proyecto
    setTareas(p => p.map(x => x.documentId === t.documentId ? { ...x, proyecto: null } : x))
    updateTarea(t.documentId, { proyecto: { disconnect: [{ id: prev.id }] } }).catch(() => {
      setTareas(p => p.map(x => x.documentId === t.documentId ? { ...x, proyecto: prev } : x))
      toast.error("Error al quitar del proyecto")
    })
  }

  function toggleProyectoColapsado(documentId: string) {
    setProyectosColapsados(prev => {
      const next = new Set(prev)
      next.has(documentId) ? next.delete(documentId) : next.add(documentId)
      return next
    })
  }

  async function confirmarRenombrarProyecto() {
    if (!renombrandoProyecto) return
    const docId = renombrandoProyecto
    const nuevoNombre = nombreRenombrado.trim()
    setRenombrandoProyecto(null)
    const afectadas = tareas.filter(t => t.proyecto?.documentId === docId)
    if (!nuevoNombre || afectadas.length === 0 || nuevoNombre === afectadas[0].proyecto?.nombre) return
    const anterior = afectadas[0].proyecto!
    setTareas(prev => prev.map(t => t.proyecto?.documentId === docId ? { ...t, proyecto: { ...t.proyecto!, nombre: nuevoNombre } } : t))
    try {
      await updateProyecto(docId, { nombre: nuevoNombre })
      toast.success(`Proyecto renombrado a "${nuevoNombre}"`)
    } catch {
      setTareas(prev => prev.map(t => t.proyecto?.documentId === docId ? { ...t, proyecto: anterior } : t))
      toast.error("Error al renombrar")
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

  const filtrosAvanzadosActivos = [
    filtroRango !== "todas",
    !!filtroPrioridad,
    !!filtroEtiqueta,
    !!filtroResponsable,
    filtroTicket,
  ].filter(Boolean).length

  const limpiarFiltros = () => {
    setFiltro("todas"); setFiltroEtiqueta(""); setFiltroPrioridad(""); setFiltroRango("todas"); setBusqueda(""); setFiltroResponsable(""); setFiltroTicket(false)
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (estadoRef.current  && !estadoRef.current.contains(t))  setEstadoOpen(false)
      if (filtrosRef.current && !filtrosRef.current.contains(t)) setFiltrosOpen(false)
      if (estadoFieldRef.current    && !estadoFieldRef.current.contains(t))    setEstadoFieldOpen(false)
      if (prioridadFieldRef.current && !prioridadFieldRef.current.contains(t)) setPrioridadFieldOpen(false)
      if (respRef.current && !respRef.current.contains(t)) setRespOpen(false)
      if (etqRef.current  && !etqRef.current.contains(t))  setEtqOpen(false)
      if (areaRef.current && !areaRef.current.contains(t)) setAreaOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Tarjeta de una tarea — función normal (no componente aparte) para poder
  // usar todos los handlers/estado de arriba sin pasar quince props.
  function renderTareaCard(t: TareaType) {
    const dias = diasHastaVencimiento(t.fechaVencimiento)
    const vencida = dias !== null && dias < 0 && t.estado !== "completada"
    const proxima = dias !== null && dias >= 0 && dias <= 2 && t.estado !== "completada"
    const arrastrandoSobreEsta = dragOverId === t.documentId && dragId !== t.documentId

    return (
      <div
        key={t.documentId}
        draggable
        onDragStart={e => { setDragId(t.documentId); e.dataTransfer.effectAllowed = "move" }}
        onDragEnd={() => { setDragId(null); setDragOverId(null) }}
        onDragOver={e => { if (dragId && dragId !== t.documentId) { e.preventDefault(); setDragOverId(t.documentId) } }}
        onDragLeave={() => setDragOverId(prev => prev === t.documentId ? null : prev)}
        onDrop={e => { e.preventDefault(); handleDropTarea(t) }}
        onClick={() => abrirEditar(t)}
        className={`flex items-start gap-3 p-3 rounded-xl border bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm cursor-pointer transition-all ${
          arrastrandoSobreEsta
            ? "border-violet-400 dark:border-violet-500 ring-2 ring-violet-300/50 dark:ring-violet-500/30"
            : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-md"
        } ${t.estado === "completada" ? "opacity-50" : ""} ${dragId === t.documentId ? "opacity-40" : ""}`}
      >
        <button
          type="button"
          title={t.estado === "completada" ? "Marcar como sin iniciar" : "Marcar como completada"}
          onClick={e => { e.stopPropagation(); cambiarEstado(t, t.estado === "completada" ? "sin_iniciar" : "completada") }}
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
            <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
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
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                <Ticket size={9} /> Ticket
              </span>
            )}
            {filtro === "todas" && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${ESTADO_COLORS[t.estado]}`}>
                {ESTADO_LABEL[t.estado]}
              </span>
            )}
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
            {t.proyecto && (
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-violet-300 dark:border-violet-700/60 bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 inline-flex items-center gap-1 group/proy">
                {t.proyecto.nombre}
                <button type="button" title="Quitar del proyecto"
                  onClick={e => { e.stopPropagation(); quitarDeProyecto(t) }}
                  className="opacity-0 group-hover/proy:opacity-100 hover:text-red-500 transition">
                  <X size={9} />
                </button>
              </span>
            )}
            {t.fechaVencimiento && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded border inline-flex items-center gap-1 ${
                vencida ? "border-red-300 bg-red-50 dark:bg-red-950/20 text-red-500"
                : proxima ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20 text-amber-500"
                : "border-slate-200 dark:border-slate-700/50 text-muted-foreground"
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

          {(t.responsable || t.area || t.fechaCompletada || t.ticket) && (
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
              {t.estado === "completada" && t.fechaCompletada && (
                <span className="text-[10px] flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Check size={9} />
                  {fmtFechaHora(t.fechaCompletada)}
                  {t.fechaInicio && (
                    <> · {fmtDuracion(t.fechaInicio, t.fechaCompletada)}</>
                  )}
                </span>
              )}
              {t.ticket && (
                <span className="text-[10px] px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400">
                  🎫 {t.ticket.titulo}
                </span>
              )}
            </div>
          )}

          <div onClick={e => e.stopPropagation()}>
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
              open={avancesOpen === t.documentId}
              onAgregar={nota => agregarAvance(t, nota)}
            />
          </div>
        </div>
      </div>
    )
  }

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
        style={{ background: "radial-gradient(ellipse at 55% 0%, rgba(139,92,246,0.07) 0%, transparent 55%)" }} />
      <div className="relative p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{titulo}</h1>
          <p className="text-sm text-muted-foreground">Gestiona y da seguimiento a tus tareas</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm p-1 rounded-lg border border-slate-200 dark:border-slate-700/50">
            <button type="button" onClick={() => setVista("lista")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                vista === "lista" ? "bg-slate-100 dark:bg-slate-800 text-violet-600 dark:text-violet-400 font-bold" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}>
              <List size={14} /> Lista
            </button>
            <button type="button" onClick={() => setVista("calendario")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                vista === "calendario" ? "bg-slate-100 dark:bg-slate-800 text-violet-600 dark:text-violet-400 font-bold" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}>
              <CalIcon size={14} /> Calendario
            </button>
            <button type="button" onClick={() => setVista("metricas")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                vista === "metricas" ? "bg-slate-100 dark:bg-slate-800 text-violet-600 dark:text-violet-400 font-bold" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}>
              <BarChart2 size={14} /> Métricas
            </button>
          </div>
          <Button onClick={() => abrirCrear()} size="sm" className="bg-violet-600 hover:bg-violet-700">
            <Plus size={14} className="mr-1" />
            <span className="hidden sm:inline">Nueva tarea</span>
            <span className="sm:hidden">Nueva</span>
          </Button>
        </div>
      </div>

      {/* Barra de filtros */}
      {vista === "lista" && (
        <div className="flex items-center gap-2 mb-6 mt-2 flex-wrap">
          {/* Búsqueda */}
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar..."
              className="h-9 pl-9 text-sm bg-white/80 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Dropdown Estado */}
          <div ref={estadoRef} className="relative">
            <button
              type="button"
              onClick={() => { setEstadoOpen(v => !v); setFiltrosOpen(false) }}
              className="h-9 flex items-center gap-2 px-3 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-600 transition-colors shadow-sm"
            >
              <span className={`h-2 w-2 rounded-full shrink-0 ${
                filtro === "en_progreso" ? "bg-blue-500"
                : filtro === "en_pausa"  ? "bg-violet-500"
                : filtro === "completada" ? "bg-emerald-500"
                : filtro === "sin_iniciar" ? "bg-slate-400"
                : "bg-slate-300"
              }`} />
              <span>{filtro === "todas" ? "Estado" : ESTADOS.find(e => e.key === filtro)?.label}</span>
              <ChevronDown size={13} className={`text-muted-foreground transition-transform duration-150 ${estadoOpen ? "rotate-180" : ""}`} />
            </button>
            {estadoOpen && (
              <div className="absolute top-full left-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl z-30 min-w-[190px] py-1 overflow-hidden">
                {ESTADOS.map(e => {
                  const count = e.key === "todas" ? tareas.length
                    : e.key === "sin_iniciar"  ? stats.sinIniciar
                    : e.key === "en_progreso"  ? stats.enProgreso
                    : e.key === "en_pausa"     ? stats.enPausa
                    : stats.completadas
                  return (
                    <button
                      key={e.key}
                      type="button"
                      onClick={() => { setFiltro(e.key); setEstadoOpen(false) }}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${filtro === e.key ? "text-violet-600 dark:text-violet-400 font-medium" : "text-slate-700 dark:text-slate-200"}`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${
                          e.key === "en_progreso"  ? "bg-blue-500"
                          : e.key === "en_pausa"   ? "bg-violet-500"
                          : e.key === "completada" ? "bg-emerald-500"
                          : "bg-slate-400"
                        }`} />
                        {e.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground tabular-nums">{count}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Dropdown Filtros avanzados */}
          <div ref={filtrosRef} className="relative">
            <button
              type="button"
              onClick={() => { setFiltrosOpen(v => !v); setEstadoOpen(false) }}
              className={`h-9 flex items-center gap-1.5 px-3 text-sm rounded-lg border transition-colors shadow-sm ${
                filtrosAvanzadosActivos > 0
                  ? "border-violet-400/60 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                  : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-600"
              }`}
            >
              <SlidersHorizontal size={13} />
              <span>Filtros</span>
              {filtrosAvanzadosActivos > 0 && (
                <span className="h-4 w-4 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {filtrosAvanzadosActivos}
                </span>
              )}
              <ChevronDown size={13} className={`text-muted-foreground transition-transform duration-150 ${filtrosOpen ? "rotate-180" : ""}`} />
            </button>
            {filtrosOpen && (
              <div className="absolute top-full right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl z-30 w-64 p-3 space-y-3">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Rango de fecha</p>
                  <DropdownPicker label="Rango de fecha" value={filtroRango}
                    onChange={v => setFiltroRango(v as RangoFecha)}
                    options={RANGOS.map(r => ({ value: r.key, label: r.label }))} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Prioridad</p>
                  <DropdownPicker label="Prioridad" value={filtroPrioridad}
                    onChange={v => setFiltroPrioridad(v as PrioridadTarea | "")}
                    placeholder="Todas"
                    options={[{ value: "", label: "Todas" }, ...PRIORIDADES.map(p => ({ value: p, label: PRIORIDAD_LABEL[p] }))]} />
                </div>
                {etiquetasUsadas.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Etiqueta</p>
                    <DropdownPicker label="Etiqueta" value={filtroEtiqueta} onChange={setFiltroEtiqueta}
                      placeholder="Todas"
                      options={[{ value: "", label: "Todas" }, ...etiquetasUsadas.map(et => ({ value: et, label: et }))]} />
                  </div>
                )}
                {responsablesUsados.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Responsable</p>
                    <DropdownPicker label="Responsable" value={filtroResponsable} onChange={setFiltroResponsable}
                      placeholder="Todos"
                      options={[{ value: "", label: "Todos" }, ...responsablesUsados.map(r => ({ value: r, label: r }))]} />
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setFiltroTicket(v => !v)}
                    className={`flex items-center gap-1.5 text-xs transition-colors ${filtroTicket ? "text-violet-600 dark:text-violet-400" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <span className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${filtroTicket ? "border-violet-500 bg-violet-500" : "border-slate-300 dark:border-slate-600"}`}>
                      {filtroTicket && <Check size={9} className="text-white" />}
                    </span>
                    Solo tickets
                  </button>
                  {filtrosAvanzadosActivos > 0 && (
                    <button
                      type="button"
                      onClick={() => { setFiltroRango("todas"); setFiltroPrioridad(""); setFiltroEtiqueta(""); setFiltroResponsable(""); setFiltroTicket(false) }}
                      className="text-[11px] text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Agrupar/desagrupar por proyecto — solo visual, no toca el campo proyecto */}
          <button
            type="button"
            onClick={() => setAgruparPorProyecto(v => !v)}
            title={agruparPorProyecto ? "Mostrar tareas sin agrupar" : "Agrupar tareas por proyecto"}
            className={`h-9 flex items-center gap-1.5 px-3 text-sm rounded-lg border transition-colors shadow-sm ${
              agruparPorProyecto
                ? "border-violet-400/60 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-600"
            }`}
          >
            <Layers size={13} />
            <span>{agruparPorProyecto ? "Agrupado" : "Sin agrupar"}</span>
          </button>

          {(filtro !== "todas" || filtroEtiqueta || filtroPrioridad || filtroRango !== "todas" || busqueda.trim() || filtroResponsable || filtroTicket) && (
            <button type="button" onClick={limpiarFiltros}
              className="text-xs px-2 py-1.5 text-muted-foreground hover:text-foreground">
              Limpiar todo
            </button>
          )}
        </div>
      )}

      {/* VISTA: LISTA */}
      {vista === "lista" && (
        loading ? (
          <div className="animate-pulse space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-slate-200 dark:bg-slate-700" />
            ))}
          </div>
        ) : filtradas.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {tareas.length === 0 ? "No hay tareas. Crea una." : "Sin resultados con los filtros actuales."}
          </p>
        ) : (
          <div className="space-y-2">
            {gruposRenderizados.map(g => {
              if (g.tipo === "suelta") return renderTareaCard(g.tarea)

              const colapsado = proyectosColapsados.has(g.proyecto.documentId)
              const renombrandoEste = renombrandoProyecto === g.proyecto.documentId
              return (
                <div key={`proyecto-${g.proyecto.documentId}`}
                  className="rounded-xl border border-violet-200 dark:border-violet-800/40 bg-violet-50/40 dark:bg-violet-500/5 p-2 space-y-2">
                  {renombrandoEste ? (
                    <div className="flex items-center gap-1.5 px-1.5 py-0.5" onClick={e => e.stopPropagation()}>
                      <input autoFocus value={nombreRenombrado} onChange={e => setNombreRenombrado(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") confirmarRenombrarProyecto(); if (e.key === "Escape") setRenombrandoProyecto(null) }}
                        className={`flex-1 h-7 text-xs ${fieldCls}`} />
                      <button type="button" onClick={confirmarRenombrarProyecto} title="Guardar"
                        className="p-1 text-emerald-600 hover:text-emerald-700 rounded transition-colors shrink-0">
                        <Check size={13} />
                      </button>
                      <button type="button" onClick={() => setRenombrandoProyecto(null)} title="Cancelar"
                        className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors shrink-0">
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full flex items-center gap-2 px-1.5 py-1 group/grupo">
                      <button type="button" onClick={() => toggleProyectoColapsado(g.proyecto.documentId)}
                        className="flex items-center gap-2 flex-1 min-w-0 text-left">
                        <ChevronDown size={13} className={`text-violet-500 shrink-0 transition-transform ${colapsado ? "-rotate-90" : ""}`} />
                        <span className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wide truncate">{g.proyecto.nombre}</span>
                        <span className="text-[10px] text-violet-500/70 dark:text-violet-400/60 tabular-nums shrink-0">{g.tareas.length}</span>
                      </button>
                      <button type="button" title="Renombrar proyecto"
                        onClick={() => { setRenombrandoProyecto(g.proyecto.documentId); setNombreRenombrado(g.proyecto.nombre) }}
                        className="p-1 text-violet-400/60 hover:text-violet-600 dark:hover:text-violet-300 rounded opacity-0 group-hover/grupo:opacity-100 transition shrink-0">
                        <Pencil size={12} />
                      </button>
                    </div>
                  )}
                  {!colapsado && (
                    <div className="space-y-2">
                      {g.tareas.map(t => renderTareaCard(t))}
                    </div>
                  )}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={cerrarModalSiVacio}>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 w-full max-w-md space-y-4 border border-slate-200 dark:border-slate-700 shadow-xl max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">{editando ? "Editar tarea" : "Nueva tarea"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors">
                <X size={15} />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-500 dark:text-slate-400">Título <span className="text-violet-500">*</span></label>
              <input
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                placeholder="Ej. Revisar propuesta"
                className={fieldCls}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-500 dark:text-slate-400">Descripción</label>
              <textarea
                value={form.descripcion ?? ""}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value || null }))}
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-400 dark:hover:border-slate-600 outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors shadow-sm resize-none"
                placeholder="Detalles, contexto..."
              />
            </div>

            {/* Atributos — desplegable: Estado, Prioridad, Fechas, Responsable, Área */}
            <div className="space-y-1">
              <button type="button" onClick={() => setAtributosOpen(a => !a)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Atributos</span>
                <ChevronDown size={13} className={`text-slate-400 transition-transform duration-150 ${atributosOpen ? "rotate-180" : ""}`} />
              </button>
              {atributosOpen && (
                <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 space-y-3">

                  <div className="grid grid-cols-2 gap-3">
                    {/* Estado */}
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 dark:text-slate-400">Estado</label>
                      <div ref={estadoFieldRef} className="relative">
                        <button
                          type="button"
                          onClick={() => { setEstadoFieldOpen(v => !v); setPrioridadFieldOpen(false); setRespOpen(false); setEtqOpen(false); setAreaOpen(false) }}
                          className="w-full h-9 flex items-center gap-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm transition-colors hover:border-slate-400 dark:hover:border-slate-600 shadow-sm"
                        >
                          <span className={`h-2 w-2 rounded-full shrink-0 ${
                            form.estado === "en_progreso" ? "bg-blue-500"
                            : form.estado === "en_pausa"  ? "bg-violet-500"
                            : form.estado === "completada" ? "bg-emerald-500"
                            : "bg-slate-400"
                          }`} />
                          <span className="flex-1 text-left">{ESTADO_LABEL[form.estado ?? "sin_iniciar"]}</span>
                          <ChevronDown size={13} className={`text-slate-400 transition-transform duration-150 ${estadoFieldOpen ? "rotate-180" : ""}`} />
                        </button>
                        {estadoFieldOpen && (
                          <div ref={estadoPanelRef} className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl z-50 py-1 overflow-hidden">
                            {(["sin_iniciar","en_progreso","en_pausa","completada"] as EstadoTarea[]).map(e => (
                              <button key={e} type="button"
                                onClick={() => { setForm(f => ({ ...f, estado: e })); setEstadoFieldOpen(false) }}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${form.estado === e ? "text-violet-600 dark:text-violet-400 font-medium" : "text-slate-700 dark:text-slate-200"}`}
                              >
                                <span className={`h-2 w-2 rounded-full shrink-0 ${
                                  e === "en_progreso" ? "bg-blue-500"
                                  : e === "en_pausa"  ? "bg-violet-500"
                                  : e === "completada" ? "bg-emerald-500"
                                  : "bg-slate-400"
                                }`} />
                                {ESTADO_LABEL[e]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Prioridad */}
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 dark:text-slate-400">Prioridad</label>
                      <div ref={prioridadFieldRef} className="relative">
                        <button
                          type="button"
                          onClick={() => { setPrioridadFieldOpen(v => !v); setEstadoFieldOpen(false); setRespOpen(false); setEtqOpen(false); setAreaOpen(false) }}
                          className="w-full h-9 flex items-center gap-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm transition-colors hover:border-slate-400 dark:hover:border-slate-600 shadow-sm"
                        >
                          <span className={`h-2 w-2 rounded-full shrink-0 ${
                            form.prioridad === "urgente" ? "bg-red-500"
                            : form.prioridad === "alta"  ? "bg-amber-500"
                            : "bg-slate-400"
                          }`} />
                          <span className="flex-1 text-left">{PRIORIDAD_LABEL[form.prioridad ?? "media"]}</span>
                          <ChevronDown size={13} className={`text-slate-400 transition-transform duration-150 ${prioridadFieldOpen ? "rotate-180" : ""}`} />
                        </button>
                        {prioridadFieldOpen && (
                          <div ref={prioridadPanelRef} className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl z-50 py-1 overflow-hidden">
                            {PRIORIDADES.map(p => (
                              <button key={p} type="button"
                                onClick={() => { setForm(f => ({ ...f, prioridad: p })); setPrioridadFieldOpen(false) }}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${form.prioridad === p ? "text-violet-600 dark:text-violet-400 font-medium" : "text-slate-700 dark:text-slate-200"}`}
                              >
                                <span className={`h-2 w-2 rounded-full shrink-0 ${
                                  p === "urgente" ? "bg-red-500" : p === "alta" ? "bg-amber-500" : "bg-slate-400"
                                }`} />
                                {PRIORIDAD_LABEL[p]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 dark:text-slate-400">
                        Fecha inicio {!editando && <span className="text-muted-foreground font-normal">(auto)</span>}
                      </label>
                      <div className="h-9 flex items-center px-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm text-slate-400 dark:text-slate-500">
                        {editando && form.fechaInicio ? fmtFechaHora(form.fechaInicio) : "Automático"}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 dark:text-slate-400">Fecha límite</label>
                      <Input
                        type="date"
                        value={form.fechaVencimiento ?? ""}
                        onChange={e => setForm(f => ({ ...f, fechaVencimiento: e.target.value || null }))}
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Responsable */}
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 dark:text-slate-400">Responsable</label>
                      <div ref={respRef} className="relative">
                        <button type="button"
                          onClick={() => { setRespOpen(v => !v); setRespQuery(""); setEstadoFieldOpen(false); setPrioridadFieldOpen(false); setEtqOpen(false); setAreaOpen(false) }}
                          className="w-full h-9 flex items-center gap-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm transition-colors hover:border-slate-400 dark:hover:border-slate-600 shadow-sm">
                          <span className={`flex-1 text-left truncate ${form.responsable ? "text-slate-800 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}`}>
                            {form.responsable ?? "Sin responsable"}
                          </span>
                          <ChevronDown size={13} className={`text-slate-400 transition-transform duration-150 shrink-0 ${respOpen ? "rotate-180" : ""}`} />
                        </button>
                        {respOpen && (
                          <div ref={respPanelRef} className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl z-50 overflow-hidden">
                            <div className="px-2 pt-2 pb-1">
                              <input autoFocus value={respQuery} onChange={e => setRespQuery(e.target.value)}
                                placeholder="Buscar..." className={`text-sm ${fieldCls}`} />
                            </div>
                            <div className="max-h-44 overflow-y-auto py-1">
                              <button type="button"
                                onClick={() => { setForm(f => ({ ...f, responsable: null })); setRespOpen(false) }}
                                className={`w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${!form.responsable ? "text-violet-500 font-medium" : "text-slate-400 dark:text-slate-500"}`}>
                                Sin responsable
                              </button>
                              {responsablesUsados
                                .filter(r => r.toLowerCase().includes(respQuery.toLowerCase()))
                                .map(r => (
                                  <button key={r} type="button"
                                    onClick={() => { setForm(f => ({ ...f, responsable: r })); setRespOpen(false) }}
                                    className={`w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${form.responsable === r ? "text-violet-600 dark:text-violet-400 font-medium" : "text-slate-700 dark:text-slate-200"}`}>
                                    {r}
                                  </button>
                                ))}
                              {respQuery && !responsablesUsados.some(r => r.toLowerCase() === respQuery.toLowerCase()) && (
                                <button type="button"
                                  onClick={() => { setForm(f => ({ ...f, responsable: respQuery })); setRespOpen(false) }}
                                  className="w-full text-left px-3 py-1.5 text-sm text-violet-500 dark:text-violet-400 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
                                  + Usar &quot;{respQuery}&quot;
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Área de solicitud */}
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 dark:text-slate-400">Área de solicitud</label>
                      <div ref={areaRef} className="relative">
                        <button type="button"
                          onClick={() => { setAreaOpen(v => !v); setAreaQuery(""); setEstadoFieldOpen(false); setPrioridadFieldOpen(false); setRespOpen(false); setEtqOpen(false) }}
                          className="w-full h-9 flex items-center gap-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm transition-colors hover:border-slate-400 dark:hover:border-slate-600 shadow-sm">
                          <span className={`flex-1 text-left truncate ${form.area ? "text-slate-800 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}`}>
                            {form.area ?? "Sin área"}
                          </span>
                          <ChevronDown size={13} className={`text-slate-400 transition-transform duration-150 shrink-0 ${areaOpen ? "rotate-180" : ""}`} />
                        </button>
                        {areaOpen && (
                          <div ref={areaPanelRef} className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl z-50 overflow-hidden">
                            <div className="px-2 pt-2 pb-1">
                              <input autoFocus value={areaQuery} onChange={e => setAreaQuery(e.target.value)}
                                placeholder="Buscar..." className={`text-sm ${fieldCls}`} />
                            </div>
                            <div className="max-h-44 overflow-y-auto py-1">
                              <button type="button"
                                onClick={() => { setForm(f => ({ ...f, area: null })); setAreaOpen(false) }}
                                className={`w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${!form.area ? "text-violet-500 font-medium" : "text-slate-400 dark:text-slate-500"}`}>
                                Sin área
                              </button>
                              {areasUsadas
                                .filter(a => a.toLowerCase().includes(areaQuery.toLowerCase()))
                                .map(a => (
                                  <button key={a} type="button"
                                    onClick={() => { setForm(f => ({ ...f, area: a })); setAreaOpen(false) }}
                                    className={`w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${form.area === a ? "text-violet-600 dark:text-violet-400 font-medium" : "text-slate-700 dark:text-slate-200"}`}>
                                    {a}
                                  </button>
                                ))}
                              {areaQuery && !areasUsadas.some(a => a.toLowerCase() === areaQuery.toLowerCase()) && (
                                <button type="button"
                                  onClick={() => { setForm(f => ({ ...f, area: areaQuery })); setAreaOpen(false) }}
                                  className="w-full text-left px-3 py-1.5 text-sm text-violet-500 dark:text-violet-400 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
                                  + Usar &quot;{areaQuery}&quot;
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Etiqueta */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500 dark:text-slate-400">Etiqueta</label>
              <div ref={etqRef} className="relative">
                <button type="button"
                  onClick={() => { setEtqOpen(v => !v); setEtqQuery(""); setEstadoFieldOpen(false); setPrioridadFieldOpen(false); setRespOpen(false); setAreaOpen(false) }}
                  className="w-full h-9 flex items-center gap-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm transition-colors hover:border-slate-400 dark:hover:border-slate-600 shadow-sm">
                  <span className={`flex-1 text-left truncate ${form.etiqueta ? "text-slate-800 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}`}>
                    {form.etiqueta ?? "campaña, urgente..."}
                  </span>
                  <ChevronDown size={13} className={`text-slate-400 transition-transform duration-150 shrink-0 ${etqOpen ? "rotate-180" : ""}`} />
                </button>
                {etqOpen && (
                  <div ref={etqPanelRef} className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl z-50 overflow-hidden">
                    <div className="px-2 pt-2 pb-1">
                      <input autoFocus value={etqQuery} onChange={e => setEtqQuery(e.target.value)}
                        placeholder="Buscar..." className={`text-sm ${fieldCls}`} />
                    </div>
                    <div className="max-h-44 overflow-y-auto py-1">
                      <button type="button"
                        onClick={() => { setForm(f => ({ ...f, etiqueta: null })); setEtqOpen(false) }}
                        className={`w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${!form.etiqueta ? "text-violet-500 font-medium" : "text-slate-400 dark:text-slate-500"}`}>
                        Ninguna
                      </button>
                      {etiquetasUsadas
                        .filter(et => et.toLowerCase().includes(etqQuery.toLowerCase()))
                        .map(et => (
                          <button key={et} type="button"
                            onClick={() => { setForm(f => ({ ...f, etiqueta: et })); setEtqOpen(false) }}
                            className={`w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${form.etiqueta === et ? "text-violet-600 dark:text-violet-400 font-medium" : "text-slate-700 dark:text-slate-200"}`}>
                            {et}
                          </button>
                        ))}
                      {etqQuery && !etiquetasUsadas.some(et => et.toLowerCase() === etqQuery.toLowerCase()) && (
                        <button type="button"
                          onClick={() => { setForm(f => ({ ...f, etiqueta: etqQuery })); setEtqOpen(false) }}
                          className="w-full text-left px-3 py-1.5 text-sm text-violet-500 dark:text-violet-400 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
                          + Usar &quot;{etqQuery}&quot;
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notas y Enlaces — desplegables, se pueden agregar antes de guardar */}
            <NotasCampoModal value={form.notas ?? null} onChange={v => setForm(f => ({ ...f, notas: v }))} />
            <LinksCampoModal value={form.links ?? null} onChange={v => setForm(f => ({ ...f, links: v }))} />

            <div className="flex gap-2 justify-end pt-1 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm transition-colors">Cancelar</button>
              <button type="button" onClick={guardar} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm font-medium transition-colors">
                <Check size={14} />
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nombrar proyecto — al soltar una tarea sobre otra cuando ninguna
          tenía proyecto todavía */}
      {nombrandoProyecto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setNombrandoProyecto(null) }}>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 w-full max-w-sm space-y-3 border border-slate-200 dark:border-slate-700 shadow-xl">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Agrupar tareas</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Ponle un nombre al proyecto para agrupar estas tareas — cualquier otra que arrastres después a cualquiera de las dos se une al mismo grupo.
            </p>
            <input autoFocus value={nombreProyectoInput} onChange={e => setNombreProyectoInput(e.target.value)}
              placeholder="Ej. Lanzamiento intranet"
              onKeyDown={e => { if (e.key === "Enter") confirmarNombrarProyecto() }}
              className={fieldCls} />
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setNombrandoProyecto(null)}
                className="flex-1 h-9 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Cancelar
              </button>
              <button type="button" onClick={confirmarNombrarProyecto} disabled={!nombreProyectoInput.trim()}
                className="flex-1 h-9 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 transition-colors">
                Agrupar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

// ─── Notas / Enlaces del modal (desplegables, cada entrada en listado) ───────
// A diferencia de AvancesPanel/LinksPanel (que persisten cada entrada de
// inmediato contra una tarea que ya existe), estos dos operan sobre el
// `form` local del modal — funcionan igual al crear (sin documentId todavía)
// que al editar, y todo se guarda junto al hacer clic en "Guardar".

function NotasCampoModal({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const [abierta, setAbierta] = useState(false)
  const [input, setInput] = useState("")
  const entradas = value ? value.split("\n").filter(Boolean) : []

  function agregar() {
    if (!input.trim()) return
    const hoy = new Date()
    const entrada = `${hoy.getDate()} ${MESES_NOMBRES[hoy.getMonth()].slice(0, 3)} · ${input.trim()}`
    onChange(value ? `${entrada}\n${value}` : entrada)
    setInput("")
  }

  return (
    <div className="space-y-1">
      <button type="button" onClick={() => setAbierta(a => !a)}
        className="w-full flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>Notas {entradas.length > 0 && <span className="text-slate-400 dark:text-slate-500">({entradas.length})</span>}</span>
        <ChevronDown size={13} className={`transition-transform duration-150 ${abierta ? "rotate-180" : ""}`} />
      </button>
      {abierta && (
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 space-y-2">
          {entradas.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {entradas.map((e, i) => {
                const sep = e.indexOf(" · ")
                const fecha = sep !== -1 ? e.slice(0, sep) : ""
                const texto = sep !== -1 ? e.slice(sep + 3) : e
                return (
                  <div key={i} className="flex gap-2 items-baseline">
                    {fecha && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 min-w-[38px] font-mono">
                        {fecha}
                      </span>
                    )}
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">{texto}</p>
                  </div>
                )
              })}
            </div>
          )}
          <div className="flex gap-2">
            <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Agregar nota..."
              className="h-7 text-xs flex-1" autoFocus
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); agregar() } }} />
            <button type="button" onClick={agregar} disabled={!input.trim()}
              className="h-7 px-2.5 text-xs rounded-md bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40 transition shrink-0">
              Agregar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function LinksCampoModal({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const [abierta, setAbierta] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const [labelInput, setLabelInput] = useState("")
  const entradas = value ? value.split("\n").filter(Boolean) : []

  function agregar() {
    const url = urlInput.trim()
    if (!url) return
    const entrada = labelInput.trim() ? `${labelInput.trim()} · ${url}` : url
    onChange(value ? `${entrada}\n${value}` : entrada)
    setUrlInput(""); setLabelInput("")
  }

  const parseEntrada = (e: string) => {
    const sep = e.indexOf(" · ")
    if (sep !== -1) return { label: e.slice(0, sep), url: e.slice(sep + 3) }
    return { label: null, url: e }
  }
  const dominio = (url: string) => { try { return new URL(url).hostname.replace("www.", "") } catch { return url.slice(0, 30) } }

  return (
    <div className="space-y-1">
      <button type="button" onClick={() => setAbierta(a => !a)}
        className="w-full flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>Enlaces {entradas.length > 0 && <span className="text-slate-400 dark:text-slate-500">({entradas.length})</span>}</span>
        <ChevronDown size={13} className={`transition-transform duration-150 ${abierta ? "rotate-180" : ""}`} />
      </button>
      {abierta && (
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 space-y-2">
          {entradas.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
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
          <div className="flex gap-2">
            <Input value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://..."
              className="h-7 text-xs flex-1" autoFocus
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); agregar() } }} />
            <Input value={labelInput} onChange={e => setLabelInput(e.target.value)} placeholder="Etiqueta (opcional)"
              className="h-7 text-xs w-28"
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); agregar() } }} />
            <button type="button" onClick={agregar} disabled={!urlInput.trim()}
              className="h-7 px-2.5 text-xs rounded-md bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40 transition shrink-0">
              +
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Panel de links (en la tarjeta, después de creada la tarea) ─────────────

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
              className="h-7 px-2.5 text-xs rounded-md bg-violet-600 text-white disabled:opacity-40 hover:bg-violet-700 transition shrink-0"
            >
              {guardando ? "..." : "Guardar"}
            </button>
          </div>
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
    <div className="border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl p-3 shadow-sm">
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
                  ? "border-violet-400/60 bg-violet-500/10"
                  : "border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              }`}
              title={`Crear tarea el ${iso}`}
            >
              <span className={`text-[10px] font-semibold ${esHoy ? "text-violet-600 dark:text-violet-400" : "text-slate-400 dark:text-slate-500"}`}>
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
