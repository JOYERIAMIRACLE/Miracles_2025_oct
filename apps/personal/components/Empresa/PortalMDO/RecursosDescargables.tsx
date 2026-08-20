"use client"

import { useState, useEffect, useRef } from "react"
import { Download, Trash2, Plus, X, Folder, Pencil, SlidersHorizontal, ChevronDown, Calendar as CalIcon, AlertTriangle, Search, BookOpen, MoreVertical } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { toast } from "sonner"
import { useGetRecursos, useGetCategorias } from "@/api/recurso/getRecursos"
import { createRecurso, updateRecurso, deleteRecurso, createRecursoCategoria, updateRecursoCategoria, deleteRecursoCategoria } from "@/api/recurso/mutateRecurso"
import type { RecursoType } from "@/types/recurso"
import { uploadMedia } from "@/lib/upload"
import { getToken, getUserRole } from "@/lib/auth"
import { Card, TabBar } from "./shared"
import { Skeleton } from "@/components/ui/skeleton"

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const fieldCls = "w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm px-3 outline-none focus:ring-2 focus:ring-violet-300 dark:focus:ring-violet-500/40 focus:border-violet-400"

const MESES = [
  { valor: "01", label: "Enero" },   { valor: "02", label: "Febrero" },
  { valor: "03", label: "Marzo" },   { valor: "04", label: "Abril" },
  { valor: "05", label: "Mayo" },    { valor: "06", label: "Junio" },
  { valor: "07", label: "Julio" },   { valor: "08", label: "Agosto" },
  { valor: "09", label: "Septiembre" }, { valor: "10", label: "Octubre" },
  { valor: "11", label: "Noviembre" },  { valor: "12", label: "Diciembre" },
]
const ANIOS_FORMULARIO = Array.from({ length: 13 }, (_, i) => String(new Date().getFullYear() + 2 - i))

function iconoParaCategoria(nombre: string) {
  return nombre.toLowerCase().includes("manual") ? BookOpen : Folder
}

function formatearRol(rol: string) {
  return rol.toLowerCase() === "ti" ? "TI" : rol.charAt(0).toUpperCase() + rol.slice(1)
}

async function errorDeRespuesta(res: Response, fallback: string): Promise<string> {
  try {
    const json = await res.json()
    const msg = json?.error?.message
    if (msg) return `${fallback} (${res.status}: ${msg})`
  } catch {}
  return `${fallback} (${res.status} ${res.statusText})`
}

function getFileMeta(mime: string, ext: string) {
  if (mime === "application/pdf")
    return { grad: "from-red-400 to-red-600", label: "PDF", badge: "bg-red-100 text-red-600" }
  if (mime.includes("presentationml") || mime.includes("powerpoint"))
    return { grad: "from-violet-400 to-violet-500", label: "PPT", badge: "bg-violet-100 text-violet-600" }
  if (mime.includes("spreadsheetml") || mime.includes("excel"))
    return { grad: "from-violet-400 to-violet-600", label: "XLS", badge: "bg-violet-100 text-violet-600" }
  if (mime.includes("wordprocessingml") || mime.includes("msword"))
    return { grad: "from-violet-400 to-violet-600", label: "DOC", badge: "bg-violet-100 text-violet-600" }
  return { grad: "from-slate-400 to-slate-600", label: ext || "FILE", badge: "bg-slate-100 text-slate-500" }
}

function PdfViewer({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  useEffect(() => {
    let cancelled = false
    const container = containerRef.current
    if (!container) return

    async function render() {
      try {
        const pdfjsLib = await import("pdfjs-dist")
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
        const pdf = await pdfjsLib.getDocument({ url, withCredentials: false }).promise
        if (cancelled) return
        const w = container!.clientWidth - 32
        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return
          const page = await pdf.getPage(i)
          const base = page.getViewport({ scale: 1 })
          const viewport = page.getViewport({ scale: w / base.width })
          const canvas = document.createElement("canvas")
          canvas.width = viewport.width
          canvas.height = viewport.height
          canvas.style.cssText = "width:100%;display:block;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,.12);background:#fff;margin-bottom:16px"
          await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise
          if (cancelled) return
          container!.appendChild(canvas)
        }
        if (!cancelled) setLoading(false)
      } catch {
        if (!cancelled) { setLoading(false); setError(true) }
      }
    }
    render()
    return () => { cancelled = true; container.innerHTML = "" }
  }, [url])

  return (
    <div className="h-full overflow-y-auto bg-slate-100 dark:bg-slate-950 p-4">
      {loading && !error && (
        <div className="h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500">
            <div className="h-8 w-8 border-2 border-slate-300 dark:border-slate-700 border-t-violet-500 rounded-full animate-spin" />
            <p className="text-sm">Cargando PDF…</p>
          </div>
        </div>
      )}
      {error && (
        <div className="h-full flex items-center justify-center">
          <p className="text-sm text-slate-400 dark:text-slate-500">No se pudo cargar el PDF</p>
        </div>
      )}
      <div ref={containerRef} />
    </div>
  )
}

function PdfPageThumb({ url, onError }: { url: string; onError: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function render() {
      try {
        const pdfjsLib = await import("pdfjs-dist")
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
        const pdf = await pdfjsLib.getDocument({ url, withCredentials: false }).promise
        if (cancelled) return
        const page = await pdf.getPage(1)
        if (cancelled) return
        const canvas = canvasRef.current
        if (!canvas) return
        const containerWidth = canvas.parentElement?.clientWidth ?? 280
        const baseViewport = page.getViewport({ scale: 1 })
        const scale = containerWidth / baseViewport.width
        const viewport = page.getViewport({ scale })
        canvas.width = viewport.width
        canvas.height = viewport.height
        await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise
        if (!cancelled) setReady(true)
      } catch {
        if (!cancelled) onError()
      }
    }
    render()
    return () => { cancelled = true }
  }, [url, onError])

  return (
    <>
      {!ready && (
        <div className="h-full flex items-center justify-center bg-linear-to-br from-red-400 to-red-600">
          <span className="text-white font-black text-3xl tracking-widest select-none">PDF</span>
        </div>
      )}
      <canvas ref={canvasRef} className={`w-full h-auto block ${ready ? "" : "hidden"}`} />
    </>
  )
}

function CardThumb({ r }: { r: RecursoType }) {
  const mime  = r.archivo?.mime ?? ""
  const ext   = (r.archivo?.ext ?? r.archivo?.name?.split(".").pop() ?? "").replace(".", "").toUpperCase()
  const isImg = mime.startsWith("image/")
  const isPdf = mime === "application/pdf"
  const url   = r.archivo?.url ?? ""
  const [fail, setFail] = useState(false)

  if (isImg && url)
    return <div className="h-full w-full flex items-center justify-center"><img src={url} alt={r.nombre} className="max-w-full max-h-full object-contain" /></div>
  if (isPdf && url && !fail)
    return <PdfPageThumb url={url} onError={() => setFail(true)} />
  const { grad, label } = getFileMeta(mime, ext)
  return (
    <div className={`h-full flex items-center justify-center bg-linear-to-br ${grad}`}>
      <span className="text-white font-black text-3xl tracking-widest select-none opacity-90">{label}</span>
    </div>
  )
}

function PreviewModal({ recurso, onClose, onDescargar, onEditar }: {
  recurso: RecursoType; onClose: () => void; onDescargar: () => void; onEditar?: () => void
}) {
  const mime = recurso.archivo?.mime ?? ""
  const rawUrl = recurso.archivo?.url ?? ""
  const url = rawUrl.startsWith("http") ? rawUrl : `${BASE_URL}${rawUrl}`
  const ext = (recurso.archivo?.ext ?? recurso.archivo?.name?.split(".").pop() ?? "").replace(".", "").toUpperCase()
  const isImg = mime.startsWith("image/")
  const isPdf = mime === "application/pdf"
  const isOffice = mime.includes("presentationml") || mime.includes("powerpoint") || mime.includes("spreadsheetml") || mime.includes("excel") || mime.includes("wordprocessingml") || mime.includes("msword")
  const canPreview = isImg || isPdf || isOffice
  const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`
  const { badge, label } = getFileMeta(mime, ext)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-60 flex flex-col items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex flex-col w-full h-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-start gap-3 px-4 py-3 bg-slate-900 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${badge}`}>{label}</span>
              <p className="text-sm font-semibold text-white truncate">{recurso.nombre}</p>
            </div>
            {recurso.descripcion && <p className="text-xs text-white/60 mt-1 leading-relaxed line-clamp-2">{recurso.descripcion}</p>}
          </div>
          <button type="button" onClick={onDescargar}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500 text-white text-xs font-semibold rounded-lg hover:bg-violet-600 transition-colors shrink-0">
            <Download className="h-3 w-3" /> Descargar
          </button>
          {onEditar && (
            <button type="button" onClick={onEditar}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white text-xs font-semibold rounded-lg hover:bg-white/20 transition-colors shrink-0">
              <Pencil className="h-3 w-3" /> Editar
            </button>
          )}
          <button type="button" onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden bg-slate-100 dark:bg-slate-950 min-h-0">
          {isImg && <div className="h-full flex items-center justify-center p-6"><img src={url} alt={recurso.nombre} className="max-h-full max-w-full object-contain rounded-xl shadow-lg" /></div>}
          {isPdf && <PdfViewer url={url} />}
          {isOffice && <iframe src={officeUrl} className="h-full w-full border-0" title={recurso.nombre} />}
          {!canPreview && (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400 dark:text-slate-500 p-8 text-center">
              <span className="text-5xl">📎</span>
              <p className="text-sm">Vista previa no disponible para este tipo de archivo.</p>
              <button type="button" onClick={onDescargar}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-500 text-white text-sm font-semibold rounded-xl hover:bg-violet-600 transition-colors">
                <Download className="h-4 w-4" /> Descargar para ver
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SelectCustom({ value, onChange, opciones, placeholder, className, wrapClassName, disabled }: {
  value: string; onChange: (v: string) => void; opciones: { valor: string; label: string }[]
  placeholder: string; className?: string; wrapClassName?: string; disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const seleccionado = opciones.find(o => o.valor === value)

  return (
    <div ref={ref} className={`relative ${wrapClassName ?? ""}`}>
      <button type="button" disabled={disabled} onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between gap-1.5 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className ?? ""}`}>
        <span className="truncate">{seleccionado?.label ?? placeholder}</span>
        <ChevronDown className={`h-3 w-3 shrink-0 text-slate-400 dark:text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-full max-h-56 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg z-40 py-1">
          {opciones.map(o => (
            <button key={o.valor} type="button" onClick={() => { onChange(o.valor); setOpen(false) }}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${o.valor === value ? "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-slate-800 font-medium" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function CampoConOpciones({ campo, label, value, onChange, opciones, placeholder, help, onRenombrar }: {
  campo: "categoria" | "tipo" | "variante"; label: string; value: string; onChange: (v: string) => void
  opciones: string[]; placeholder: string; help: string
  onRenombrar?: (campo: "categoria" | "tipo" | "variante", valorViejo: string, valorNuevo: string) => Promise<void>
}) {
  const [modoNuevo, setModoNuevo] = useState(opciones.length === 0)
  const [renombrando, setRenombrando] = useState(false)
  const [valorARenombrar, setValorARenombrar] = useState("")
  const [nombreNuevo, setNombreNuevo] = useState("")
  const [guardandoRenombre, setGuardandoRenombre] = useState(false)

  function iniciarRenombre() { setValorARenombrar(value); setNombreNuevo(value); setRenombrando(true) }

  async function handleGuardarRenombre() {
    if (!nombreNuevo.trim() || !onRenombrar) return
    setGuardandoRenombre(true)
    try {
      await onRenombrar(campo, valorARenombrar, nombreNuevo.trim())
      if (value === valorARenombrar) onChange(nombreNuevo.trim())
      setRenombrando(false)
    } finally { setGuardandoRenombre(false) }
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{label} <span className="text-slate-300 dark:text-slate-600">(opcional)</span></label>
      {modoNuevo ? (
        <div className="flex gap-1.5">
          <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoFocus={opciones.length > 0}
            className={`flex-1 ${fieldCls}`} />
          {opciones.length > 0 && (
            <button type="button" onClick={() => { setModoNuevo(false); onChange("") }}
              className="h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0">
              Cancelar
            </button>
          )}
        </div>
      ) : (
        <div className="flex gap-1.5">
          <SelectCustom value={value} disabled={renombrando}
            onChange={v => { if (v === "__nueva__") { setModoNuevo(true); onChange("") } else onChange(v) }}
            opciones={[{ valor: "", label: "Ninguno" }, ...opciones.map(o => ({ valor: o, label: o })), { valor: "__nueva__", label: "+ Agregar nueva…" }]}
            placeholder="Ninguno" wrapClassName="flex-1" className={fieldCls} />
          {onRenombrar && value && !renombrando && (
            <button type="button" onClick={iniciarRenombre} title="Renombrar esta opción"
              className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-violet-500 hover:border-violet-300 dark:hover:border-violet-500/60 transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
      {renombrando && (
        <div className="flex gap-1.5">
          <input value={nombreNuevo} onChange={e => setNombreNuevo(e.target.value)} autoFocus className={`flex-1 ${fieldCls}`} />
          <button type="button" onClick={handleGuardarRenombre} disabled={guardandoRenombre}
            className="h-9 px-2.5 rounded-lg bg-violet-500 text-white text-xs font-semibold hover:bg-violet-600 disabled:opacity-50 transition-colors shrink-0">
            {guardandoRenombre ? "…" : "Guardar"}
          </button>
          <button type="button" onClick={() => setRenombrando(false)} disabled={guardandoRenombre}
            className="h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0">
            Cancelar
          </button>
        </div>
      )}
      <p className="text-[10px] text-slate-400 dark:text-slate-500">
        {renombrando ? `Esto actualiza "${valorARenombrar}" en todos los recursos que lo usen.` : help}
      </p>
    </div>
  )
}

function SelectMesAnio({ mes, anio, onMesChange, onAnioChange, help }: {
  mes: string; anio: string; onMesChange: (v: string) => void; onAnioChange: (v: string) => void; help: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Fecha de lanzamiento <span className="text-slate-300 dark:text-slate-600">(opcional)</span></label>
      <div className="flex gap-1.5">
        <SelectCustom value={mes} onChange={onMesChange} placeholder="Mes: Ninguno" wrapClassName="flex-1" className={fieldCls}
          opciones={[{ valor: "", label: "Mes: Ninguno" }, ...MESES.map(m => ({ valor: m.valor, label: m.label }))]} />
        <SelectCustom value={anio} onChange={onAnioChange} placeholder="Año: Ninguno" wrapClassName="flex-1" className={fieldCls}
          opciones={[{ valor: "", label: "Año: Ninguno" }, ...ANIOS_FORMULARIO.map(a => ({ valor: a, label: a }))]} />
      </div>
      <p className="text-[10px] text-slate-400 dark:text-slate-500">{help}</p>
    </div>
  )
}

type MetaRecurso = { categoria: string | null; tipo: string | null; variante: string | null }

function SubirRecursoModal({ seccionDefault, categoriaDefault, categoriasExistentes, recursosExistentes, onClose, onSubido, onRenombrar }: {
  seccionDefault: string; categoriaDefault?: string; categoriasExistentes?: string[]; recursosExistentes: MetaRecurso[]
  onClose: () => void; onSubido: () => void
  onRenombrar: (campo: "categoria" | "tipo" | "variante", valorViejo: string, valorNuevo: string) => Promise<void>
}) {
  const [archivos, setArchivos] = useState<File[]>([])
  const [arrastrando, setArrastrando] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [categoria, setCategoria] = useState(categoriaDefault ?? "")
  const [tipo, setTipo] = useState("")
  const [variante, setVariante] = useState("")
  const [mesLanzamiento, setMesLanzamiento] = useState("")
  const [anioLanzamiento, setAnioLanzamiento] = useState("")

  const opcionesCategoria = categoriasExistentes ?? []
  const opcionesTipo = [...new Set(recursosExistentes.filter(r => !categoria.trim() || r.categoria === categoria.trim()).map(r => r.tipo).filter((t): t is string => !!t))]
  const opcionesVariante = [...new Set(recursosExistentes.filter(r => !tipo.trim() || r.tipo === tipo.trim()).map(r => r.variante).filter((v): v is string => !!v))]
  const multiple = archivos.length > 1

  function agregarArchivos(nuevos: FileList | File[]) { setArchivos(prev => [...prev, ...Array.from(nuevos)]) }
  function quitarArchivo(i: number) { setArchivos(prev => prev.filter((_, idx) => idx !== i)) }

  async function handleSubir() {
    if (archivos.length === 0) { setError("Elige al menos un archivo"); return }
    setLoading(true); setError("")
    try {
      const rolAutor = getUserRole()
      const fechaLanzamiento = (mesLanzamiento && anioLanzamiento) ? `${anioLanzamiento}-${mesLanzamiento}-01` : null
      for (const file of archivos) {
        const { id: fileId } = await uploadMedia(file)
        await createRecurso({
          nombre: file.name.replace(/\.[^./]+$/, ""), descripcion: null,
          seccion: seccionDefault, archivo: fileId, activo: true,
          categoria: categoria.trim() || null, tipo: tipo.trim() || null, variante: variante.trim() || null,
          fecha_lanzamiento: fechaLanzamiento, rol_autor: rolAutor, orden: 0,
        })
      }
      onSubido(); onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error inesperado")
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 w-full max-w-sm space-y-4 border border-slate-200 dark:border-slate-700 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Subir recurso</h2>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Archivo(s)</label>
          <div
            onDragOver={e => { e.preventDefault(); setArrastrando(true) }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={e => { e.preventDefault(); setArrastrando(false); if (e.dataTransfer.files.length) agregarArchivos(e.dataTransfer.files) }}
            className={`rounded-lg border-2 border-dashed p-3 transition-colors ${arrastrando ? "border-violet-400 bg-violet-50 dark:bg-violet-950/20" : "border-slate-200 dark:border-slate-700"}`}>
            <input type="file" multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.gif,.svg,.psd,.ai"
              onChange={e => { if (e.target.files) agregarArchivos(e.target.files); e.target.value = "" }}
              className="text-sm text-slate-600 dark:text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 file:font-medium file:text-xs hover:file:bg-slate-200 dark:hover:file:bg-slate-700" />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Arrastra uno o varios archivos aquí, o elige varios a la vez. PDF, Word, PowerPoint, Excel, imágenes, Photoshop, Illustrator.</p>
          </div>
          {archivos.length > 0 && (
            <ul className="flex flex-col gap-1 mt-1">
              {archivos.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg px-2.5 py-1.5">
                  <span className="truncate">{f.name}</span>
                  <button type="button" onClick={() => quitarArchivo(i)} className="shrink-0 text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors"><X className="h-3.5 w-3.5" /></button>
                </li>
              ))}
            </ul>
          )}
          {archivos.length > 0 && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {multiple ? `Se subirán ${archivos.length} archivos, cada uno con el nombre de su archivo. Categoría/Tipo/Versión/Fecha se aplican a todos.` : "El nombre se toma del nombre del archivo. Usa Tipo y Versión para identificarlo mejor."}
            </p>
          )}
        </div>
        <CampoConOpciones campo="categoria" label="Categoría" value={categoria} onChange={setCategoria} opciones={opcionesCategoria} placeholder="Ej. Logos" help="En qué opción del menú de la izquierda aparece." onRenombrar={onRenombrar} />
        <CampoConOpciones campo="tipo" label="Tipo" value={tipo} onChange={setTipo} opciones={opcionesTipo} placeholder="Ej. Logo oficial" help="Para poder filtrarlo después (ej. Logo oficial, Isologo)." onRenombrar={onRenombrar} />
        <CampoConOpciones campo="variante" label="Versión" value={variante} onChange={setVariante} opciones={opcionesVariante} placeholder="Ej. Negro" help="Variante del archivo, para filtrarlo después (ej. Negro, Blanco, Color)." onRenombrar={onRenombrar} />
        <SelectMesAnio mes={mesLanzamiento} anio={anioLanzamiento} onMesChange={setMesLanzamiento} onAnioChange={setAnioLanzamiento} help="Mes y año en que entró en uso esta versión, para filtrarla después." />
        {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 h-9 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
          <button type="button" onClick={handleSubir} disabled={loading} className="flex-1 h-9 rounded-lg bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 disabled:opacity-50 transition-colors">
            {loading ? "Subiendo…" : multiple ? `Subir ${archivos.length} archivos` : "Subir"}
          </button>
        </div>
      </div>
    </div>
  )
}

function EditarRecursoModal({ recurso, categoriasExistentes, recursosExistentes, onClose, onEditado, onRenombrar }: {
  recurso: RecursoType; categoriasExistentes?: string[]; recursosExistentes: MetaRecurso[]
  onClose: () => void; onEditado: () => void
  onRenombrar: (campo: "categoria" | "tipo" | "variante", valorViejo: string, valorNuevo: string) => Promise<void>
}) {
  const [categoria, setCategoria] = useState(recurso.categoria ?? "")
  const [tipo, setTipo] = useState(recurso.tipo ?? "")
  const [variante, setVariante] = useState(recurso.variante ?? "")
  const [mesLanzamiento, setMesLanzamiento] = useState(recurso.fecha_lanzamiento?.slice(5, 7) ?? "")
  const [anioLanzamiento, setAnioLanzamiento] = useState(recurso.fecha_lanzamiento?.slice(0, 4) ?? "")
  const [archivoNuevo, setArchivoNuevo] = useState<File | null>(null)
  const [arrastrando, setArrastrando] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const opcionesCategoria = categoriasExistentes ?? []
  const opcionesTipo = [...new Set(recursosExistentes.filter(r => !categoria.trim() || r.categoria === categoria.trim()).map(r => r.tipo).filter((t): t is string => !!t))]
  const opcionesVariante = [...new Set(recursosExistentes.filter(r => !tipo.trim() || r.tipo === tipo.trim()).map(r => r.variante).filter((v): v is string => !!v))]

  async function handleGuardar() {
    setLoading(true); setError("")
    try {
      let archivoId: number | undefined
      if (archivoNuevo) archivoId = (await uploadMedia(archivoNuevo)).id
      await updateRecurso(recurso.documentId, {
        categoria: categoria.trim() || null, tipo: tipo.trim() || null, variante: variante.trim() || null,
        fecha_lanzamiento: (mesLanzamiento && anioLanzamiento) ? `${anioLanzamiento}-${mesLanzamiento}-01` : null,
        ...(archivoId ? { archivo: archivoId } : {}),
      })
      onEditado(); onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error inesperado")
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 w-full max-w-sm space-y-4 border border-slate-200 dark:border-slate-700 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Editar recurso</h2>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Subido {recurso.rol_autor ? `por ${formatearRol(recurso.rol_autor)} ` : ""}
            el {recurso.createdAt ? new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric" }).format(new Date(recurso.createdAt)) : ""}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Archivo <span className="text-slate-300 dark:text-slate-600">(opcional)</span></label>
          <div
            onDragOver={e => { e.preventDefault(); setArrastrando(true) }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={e => { e.preventDefault(); setArrastrando(false); const f = e.dataTransfer.files?.[0]; if (f) setArchivoNuevo(f) }}
            className={`rounded-lg border-2 border-dashed p-2 transition-colors ${arrastrando ? "border-violet-400 bg-violet-50 dark:bg-violet-950/20" : "border-slate-200 dark:border-slate-700"}`}>
            <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.gif,.svg,.psd,.ai"
              onChange={e => setArchivoNuevo(e.target.files?.[0] ?? null)}
              className="text-sm text-slate-600 dark:text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 file:font-medium file:text-xs hover:file:bg-slate-200 dark:hover:file:bg-slate-700" />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              {archivoNuevo ? `Se reemplazará por "${archivoNuevo.name}".` : `Actual: ${recurso.archivo?.name ?? "sin archivo"}. Arrastra uno nuevo aquí o elígelo para reemplazarlo.`}
            </p>
          </div>
        </div>
        <CampoConOpciones campo="categoria" label="Categoría" value={categoria} onChange={setCategoria} opciones={opcionesCategoria} placeholder="Ej. Logos" help="En qué opción del menú de la izquierda aparece." onRenombrar={onRenombrar} />
        <CampoConOpciones campo="tipo" label="Tipo" value={tipo} onChange={setTipo} opciones={opcionesTipo} placeholder="Ej. Logo oficial" help="Para poder filtrarlo después (ej. Logo oficial, Isologo)." onRenombrar={onRenombrar} />
        <CampoConOpciones campo="variante" label="Versión" value={variante} onChange={setVariante} opciones={opcionesVariante} placeholder="Ej. Negro" help="Variante del archivo, para filtrarlo después (ej. Negro, Blanco, Color)." onRenombrar={onRenombrar} />
        <SelectMesAnio mes={mesLanzamiento} anio={anioLanzamiento} onMesChange={setMesLanzamiento} onAnioChange={setAnioLanzamiento} help="Mes y año en que entró en uso esta versión, para filtrarla después." />
        {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 h-9 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
          <button type="button" onClick={handleGuardar} disabled={loading} className="flex-1 h-9 rounded-lg bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 disabled:opacity-50 transition-colors">{loading ? "Guardando…" : "Guardar"}</button>
        </div>
      </div>
    </div>
  )
}

export type RecursoExtraTab = { id: string; label: string; icon?: LucideIcon; orden: number; content: React.ReactNode }

function agruparRecursos(lista: RecursoType[]): [string, RecursoType[]][] {
  const grupos = new Map<string, RecursoType[]>()
  for (const r of lista) {
    const key = r.grupo?.trim() || `__solo_${r.documentId}`
    if (!grupos.has(key)) grupos.set(key, [])
    grupos.get(key)!.push(r)
  }
  return Array.from(grupos.entries())
}

function RecursoCard({ variantes, puedeSubir, eliminando, onPreview, onDescargar, onEliminar, onEditar }: {
  variantes: RecursoType[]; puedeSubir: boolean; eliminando: string | null
  onPreview: (r: RecursoType) => void; onDescargar: (url: string, nombre: string) => void
  onEliminar: (documentId: string, nombre: string) => void; onEditar: (r: RecursoType) => void
}) {
  const [activoId, setActivoId] = useState(variantes[0].documentId)
  const r = variantes.find(v => v.documentId === activoId) ?? variantes[0]
  const mime = r.archivo?.mime ?? ""
  const ext = (r.archivo?.ext ?? r.archivo?.name?.split(".").pop() ?? "").replace(".", "").toUpperCase()
  const { badge, label } = getFileMeta(mime, ext)

  return (
    <div className="group relative flex flex-col rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-500/60 hover:shadow-md transition-all cursor-pointer"
      onClick={() => onPreview(r)}>
      <div className="aspect-video overflow-y-auto bg-slate-100 dark:bg-slate-800"><CardThumb r={r} /></div>
      <div className="absolute top-0 left-0 right-0 aspect-video pointer-events-none bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">Ver archivo</span>
      </div>
      {variantes.length > 1 && (
        <div className="flex flex-wrap gap-1 px-2.5 pt-2 bg-white dark:bg-slate-900" onClick={e => e.stopPropagation()}>
          {variantes.map(v => {
            const activo = v.documentId === r.documentId
            return (
              <button key={v.documentId} type="button" onClick={() => setActivoId(v.documentId)}
                className={`text-[10px] px-2 py-0.5 rounded-full border font-medium transition-colors ${activo ? "bg-violet-500 border-violet-500 text-white" : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-violet-300 hover:text-violet-500"}`}>
                {v.variante?.trim() || "···"}
              </button>
            )
          })}
        </div>
      )}
      <div className="px-2.5 py-2.5 flex flex-col gap-0.5 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-1.5">
          <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded ${badge}`}>{label}</span>
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate flex-1 leading-tight">{r.tipo?.trim() || r.nombre}</p>
          {r.archivo?.url && (
            <button type="button" onClick={e => { e.stopPropagation(); onDescargar(r.archivo!.url, r.nombre) }}
              className="shrink-0 h-6 w-6 flex items-center justify-center rounded-md text-slate-400 dark:text-slate-500 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors" title="Descargar">
              <Download className="h-3.5 w-3.5" />
            </button>
          )}
          {puedeSubir && (
            <button type="button" onClick={e => { e.stopPropagation(); onEditar(r) }}
              className="shrink-0 h-6 w-6 flex items-center justify-center rounded-md text-slate-300 dark:text-slate-600 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors opacity-0 group-hover:opacity-100" title="Editar recurso">
              <Pencil className="h-3 w-3" />
            </button>
          )}
          {puedeSubir && (
            <button type="button" onClick={e => { e.stopPropagation(); onEliminar(r.documentId, r.nombre) }} disabled={eliminando === r.documentId}
              className="shrink-0 h-6 w-6 flex items-center justify-center rounded-md text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
        {(r.variante?.trim() || r.descripcion) && <p className="text-xs text-slate-500 dark:text-slate-400 truncate leading-tight">{r.variante?.trim() || r.descripcion}</p>}
      </div>
    </div>
  )
}

function CrearCategoriaModal({ seccion, orden, onClose, onCreada }: { seccion: string; orden: number; onClose: () => void; onCreada: (nombre: string) => void }) {
  const [nombre, setNombre] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleCrear() {
    if (!nombre.trim()) { setError("Escribe un nombre"); return }
    setLoading(true); setError("")
    try {
      await createRecursoCategoria(nombre.trim(), seccion, orden)
      onCreada(nombre.trim()); onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error inesperado")
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 w-full max-w-xs space-y-4 border border-slate-200 dark:border-slate-700 shadow-xl">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Nueva categoría</h2>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Nombre</label>
          <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. Manual de Marca" autoFocus
            onKeyDown={e => { if (e.key === "Enter") handleCrear() }} className={fieldCls} />
          <p className="text-[10px] text-slate-400 dark:text-slate-500">Aparecerá vacía en el sidebar como recordatorio, hasta que subas el primer archivo.</p>
        </div>
        {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 h-9 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
          <button type="button" onClick={handleCrear} disabled={loading} className="flex-1 h-9 rounded-lg bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 disabled:opacity-50 transition-colors">{loading ? "Creando…" : "Crear"}</button>
        </div>
      </div>
    </div>
  )
}

type TabDef = { id: string; label: string; icon?: LucideIcon; orden: number; esExtra: boolean; content?: React.ReactNode }
const HUERFANOS_ID = "__sin_categoria__"

function SidebarNav({ tabs, activo, onSelect, onCrear, huerfanos, verHuerfanos, onVerHuerfanos, onReordenar, conteos, onEliminarCategoria }: {
  tabs: TabDef[]; activo: string; onSelect: (id: string) => void; onCrear?: () => void
  huerfanos?: number; verHuerfanos?: boolean; onVerHuerfanos?: () => void
  onReordenar?: (idsEnOrden: string[]) => void; conteos?: Record<string, number>; onEliminarCategoria?: (id: string) => void
}) {
  const [arrastrando, setArrastrando] = useState<number | null>(null)
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const reordenables = tabs.filter(t => !t.esExtra)

  useEffect(() => {
    if (!menuAbierto) return
    function handler(e: MouseEvent) { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuAbierto(null) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [menuAbierto])

  function handleDrop(indexDestino: number) {
    if (arrastrando === null || arrastrando === indexDestino || !onReordenar) { setArrastrando(null); return }
    const nuevos = [...reordenables]
    const [movido] = nuevos.splice(arrastrando, 1)
    nuevos.splice(indexDestino, 0, movido)
    setArrastrando(null)
    onReordenar(nuevos.map(t => t.id))
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between px-2.5 py-1.5">
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Recursos</p>
        {onCrear && (
          <button type="button" onClick={onCrear} title="Nueva categoría" aria-label="Nueva categoría"
            className="text-slate-400 dark:text-slate-500 hover:text-violet-500 dark:hover:text-violet-400 transition-colors">
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {tabs.map(t => {
        const isActive = !verHuerfanos && t.id === activo
        const Icon = t.icon ?? iconoParaCategoria(t.id)
        const puedeArrastrar = !t.esExtra && reordenables.length > 1 && !!onReordenar
        const indexReordenable = reordenables.findIndex(r => r.id === t.id)
        return (
          <div key={t.id} className={`group relative flex items-center gap-0.5 ${puedeArrastrar ? "cursor-grab active:cursor-grabbing" : ""}`}
            draggable={puedeArrastrar}
            onDragStart={() => setArrastrando(indexReordenable)}
            onDragOver={e => { if (puedeArrastrar) e.preventDefault() }}
            onDrop={() => handleDrop(indexReordenable)}
            onDragEnd={() => setArrastrando(null)}>
            <button type="button" onClick={() => onSelect(t.id)}
              className={`flex-1 min-w-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-all ${isActive ? "text-violet-600 dark:text-violet-400 bg-slate-100 dark:bg-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"}`}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{t.label}</span>
            </button>
            {onEliminarCategoria && !t.esExtra && (conteos?.[t.id] ?? 0) === 0 && (
              <div ref={menuAbierto === t.id ? menuRef : undefined} className="relative shrink-0">
                <button type="button" onClick={e => { e.stopPropagation(); setMenuAbierto(m => m === t.id ? null : t.id) }} title="Más opciones"
                  className={`h-6 w-6 flex items-center justify-center rounded-md text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${menuAbierto === t.id ? "opacity-100 bg-slate-100 dark:bg-slate-700" : "opacity-0 group-hover:opacity-100"}`}>
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
                {menuAbierto === t.id && (
                  <div className="absolute right-0 top-full mt-1 z-20 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden py-1">
                    <button type="button" onClick={e => { e.stopPropagation(); setMenuAbierto(null); onEliminarCategoria(t.id) }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left">
                      <Trash2 className="h-3.5 w-3.5" /> Eliminar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
      {!!huerfanos && onVerHuerfanos && (
        <button type="button" onClick={onVerHuerfanos}
          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-all mt-1 ${verHuerfanos ? "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-slate-800 border-r-2 border-violet-500" : "text-violet-600/80 dark:text-violet-500/80 hover:bg-violet-50 dark:hover:bg-slate-800/60"}`}>
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="truncate">Sin categoría ({huerfanos})</span>
        </button>
      )}
    </div>
  )
}

function FiltroConRenombrar({ label, value, onChange, opciones, todosLabel, campo, onRenombrar }: {
  label: string; value: string; onChange: (v: string) => void; opciones: string[]; todosLabel: string
  campo: "tipo" | "variante"; onRenombrar?: (campo: "categoria" | "tipo" | "variante", valorViejo: string, valorNuevo: string) => Promise<void>
}) {
  const [renombrando, setRenombrando] = useState(false)
  const [valorARenombrar, setValorARenombrar] = useState("")
  const [nombreNuevo, setNombreNuevo] = useState("")
  const [guardando, setGuardando] = useState(false)
  const selectPanelCls = "w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-violet-400 transition-colors"

  async function handleGuardar() {
    if (!nombreNuevo.trim() || !onRenombrar) return
    setGuardando(true)
    try {
      await onRenombrar(campo, valorARenombrar, nombreNuevo.trim())
      if (value === valorARenombrar) onChange(nombreNuevo.trim())
      setRenombrando(false)
    } finally { setGuardando(false) }
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
      {renombrando ? (
        <div className="flex gap-1.5">
          <input value={nombreNuevo} onChange={e => setNombreNuevo(e.target.value)} autoFocus className={`flex-1 ${selectPanelCls}`} />
          <button type="button" onClick={handleGuardar} disabled={guardando} className="px-2 rounded-lg bg-violet-500 text-white text-[11px] font-semibold hover:bg-violet-600 disabled:opacity-50 transition-colors shrink-0">{guardando ? "…" : "OK"}</button>
          <button type="button" onClick={() => setRenombrando(false)} disabled={guardando} className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"><X className="h-3 w-3" /></button>
        </div>
      ) : (
        <div className="flex gap-1.5">
          <SelectCustom value={value} onChange={onChange} placeholder={todosLabel} wrapClassName="flex-1" className={selectPanelCls}
            opciones={[{ valor: "", label: todosLabel }, ...opciones.map(o => ({ valor: o, label: o }))]} />
          {onRenombrar && value && (
            <button type="button" onClick={() => { setValorARenombrar(value); setNombreNuevo(value); setRenombrando(true) }} title="Renombrar esta opción"
              className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:text-violet-500 hover:border-violet-300 dark:hover:border-violet-500/60 transition-colors">
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function CategoriaFileGrid({ recursos, puedeSubir, eliminando, onPreview, onDescargar, onEliminar, onEditar, onSubir, onRenombrar, onReordenar }: {
  recursos: RecursoType[]; puedeSubir: boolean; eliminando: string | null
  onPreview: (r: RecursoType) => void; onDescargar: (url: string, nombre: string) => void
  onEliminar: (documentId: string, nombre: string) => void; onEditar: (r: RecursoType) => void; onSubir: () => void
  onRenombrar: (campo: "categoria" | "tipo" | "variante", valorViejo: string, valorNuevo: string) => Promise<void>
  onReordenar?: (idsEnOrden: string[]) => void
}) {
  const [arrastrandoIdx, setArrastrandoIdx] = useState<number | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const [filtroTipo, setFiltroTipo] = useState("")
  const [filtroVariante, setFiltroVariante] = useState("")
  const [filtroFormato, setFiltroFormato] = useState("")
  const [filtroAnio, setFiltroAnio] = useState("")
  const [filtroMes, setFiltroMes] = useState("")
  const [filtrosOpen, setFiltrosOpen] = useState(false)
  const filtrosRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (filtrosRef.current && !filtrosRef.current.contains(e.target as Node)) setFiltrosOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  function formatoDe(r: RecursoType) {
    const mime = r.archivo?.mime ?? ""
    const ext = (r.archivo?.ext ?? r.archivo?.name?.split(".").pop() ?? "").replace(".", "").toUpperCase()
    return getFileMeta(mime, ext).label
  }

  const tiposDisponibles = [...new Set(recursos.map(r => r.tipo).filter((t): t is string => !!t))]
  const variantesDisponibles = [...new Set(recursos.map(r => r.variante).filter((v): v is string => !!v))]
  const formatosDisponibles = [...new Set(recursos.map(formatoDe))]
  const fechasDisponibles = [...new Set(recursos.map(r => r.fecha_lanzamiento).filter((f): f is string => !!f))]
  const aniosDisponibles = [...new Set(fechasDisponibles.map(f => f.slice(0, 4)))].sort((a, b) => b.localeCompare(a))

  const filtrados = recursos.filter(r => {
    if (busqueda && !r.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())) return false
    if (filtroTipo && r.tipo !== filtroTipo) return false
    if (filtroVariante && r.variante !== filtroVariante) return false
    if (filtroFormato && formatoDe(r) !== filtroFormato) return false
    if (filtroAnio && (!r.fecha_lanzamiento || r.fecha_lanzamiento.slice(0, 4) !== filtroAnio)) return false
    if (filtroMes && (!r.fecha_lanzamiento || r.fecha_lanzamiento.slice(5, 7) !== filtroMes)) return false
    return true
  })

  const filtrosActivos = [filtroTipo, filtroVariante, filtroFormato, filtroAnio, filtroMes].filter(Boolean).length
  const mostrarFiltros = tiposDisponibles.length >= 1 || variantesDisponibles.length >= 1 || formatosDisponibles.length >= 1 || fechasDisponibles.length >= 1
  const mostrarBusqueda = recursos.length > 0
  const puedeReordenar = puedeSubir && !!onReordenar && filtrosActivos === 0 && !busqueda && filtrados.length > 1

  function handleDropReorder(indexDestino: number) {
    if (arrastrandoIdx === null || arrastrandoIdx === indexDestino || !onReordenar) { setArrastrandoIdx(null); return }
    const nuevos = [...filtrados]
    const [movido] = nuevos.splice(arrastrandoIdx, 1)
    nuevos.splice(indexDestino, 0, movido)
    setArrastrandoIdx(null)
    onReordenar(nuevos.map(r => r.documentId))
  }
  const selectPanelCls = "w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-violet-400 transition-colors"

  return (
    <div>
      {(mostrarBusqueda || mostrarFiltros || puedeSubir) && (
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {mostrarBusqueda && (
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre…"
                  className="h-9 pl-8 pr-7 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-violet-400 transition-colors w-40 sm:w-48" />
                {busqueda && (
                  <button type="button" onClick={() => setBusqueda("")} aria-label="Limpiar búsqueda"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
            {mostrarFiltros && (
              <div ref={filtrosRef} className="relative">
                <button type="button" onClick={() => setFiltrosOpen(v => !v)}
                  className={`h-9 flex items-center gap-1.5 px-3 text-xs rounded-lg border transition-colors shadow-sm ${filtrosActivos > 0 ? "border-violet-400/60 bg-violet-500/10 text-violet-600 dark:text-violet-400" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600"}`}>
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Filtros</span>
                  {filtrosActivos > 0 && <span className="h-4 w-4 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center">{filtrosActivos}</span>}
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 dark:text-slate-500 transition-transform ${filtrosOpen ? "rotate-180" : ""}`} />
                </button>
                {filtrosOpen && (
                  <div className="absolute top-full left-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl z-30 w-60 p-3 space-y-3">
                    {fechasDisponibles.length >= 1 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1"><CalIcon className="h-2.5 w-2.5" /> Fecha de lanzamiento</p>
                        <div className="flex gap-1.5">
                          <SelectCustom value={filtroAnio} onChange={setFiltroAnio} placeholder="Año: Todos" wrapClassName="flex-1" className={selectPanelCls}
                            opciones={[{ valor: "", label: "Año: Todos" }, ...aniosDisponibles.map(a => ({ valor: a, label: a }))]} />
                          <SelectCustom value={filtroMes} onChange={setFiltroMes} placeholder="Mes: Todos" wrapClassName="flex-1" className={selectPanelCls}
                            opciones={[{ valor: "", label: "Mes: Todos" }, ...MESES.map(m => ({ valor: m.valor, label: m.label }))]} />
                        </div>
                      </div>
                    )}
                    {tiposDisponibles.length >= 1 && <FiltroConRenombrar label="Tipo" value={filtroTipo} onChange={setFiltroTipo} opciones={tiposDisponibles} todosLabel="Todos" campo="tipo" onRenombrar={onRenombrar} />}
                    {variantesDisponibles.length >= 1 && <FiltroConRenombrar label="Versión" value={filtroVariante} onChange={setFiltroVariante} opciones={variantesDisponibles} todosLabel="Todas" campo="variante" onRenombrar={onRenombrar} />}
                    {formatosDisponibles.length >= 1 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Formato</p>
                        <SelectCustom value={filtroFormato} onChange={setFiltroFormato} placeholder="Todos" wrapClassName="w-full" className={selectPanelCls}
                          opciones={[{ valor: "", label: "Todos" }, ...formatosDisponibles.map(f => ({ valor: f, label: f }))]} />
                      </div>
                    )}
                    {filtrosActivos > 0 && (
                      <div className="flex items-center justify-end pt-1 border-t border-slate-100 dark:border-slate-800">
                        <button type="button" onClick={() => { setFiltroTipo(""); setFiltroVariante(""); setFiltroFormato(""); setFiltroAnio(""); setFiltroMes("") }}
                          className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors">Limpiar</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          {puedeSubir && (
            <button type="button" onClick={onSubir} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold rounded-lg transition-colors shrink-0">
              <Plus className="h-3 w-3" /> Subir recurso
            </button>
          )}
        </div>
      )}

      {filtrados.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500 italic">{recursos.length === 0 ? "Aún no hay archivos en esta categoría. Sube el primero." : "Sin recursos que coincidan con el filtro."}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtrados.map((r, i) => (
            <div key={r.documentId} draggable={puedeReordenar}
              onDragStart={() => setArrastrandoIdx(i)}
              onDragOver={e => { if (puedeReordenar) e.preventDefault() }}
              onDrop={() => handleDropReorder(i)}
              onDragEnd={() => setArrastrandoIdx(null)}
              className={puedeReordenar ? "cursor-grab active:cursor-grabbing" : ""}>
              <RecursoCard variantes={[r]} puedeSubir={puedeSubir} eliminando={eliminando} onPreview={onPreview} onDescargar={onDescargar} onEliminar={onEliminar} onEditar={onEditar} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function RecursosDescargables({ seccion, extraTabs = [], layout = "tabs" }: {
  seccion: string; extraTabs?: RecursoExtraTab[]; layout?: "tabs" | "sidebar"
}) {
  const { recursos, loading, reload, cargarMas, hayMas, cargandoMas } = useGetRecursos(seccion)
  const { categorias: categoriasPersistidas, reload: reloadCategorias } = useGetCategorias(seccion, layout === "sidebar")
  const [modalOpen, setModalOpen] = useState(false)
  const [crearCategoriaOpen, setCrearCategoriaOpen] = useState(false)
  const puedeSubir = true
  const [eliminando, setEliminando] = useState<string | null>(null)
  const [preview, setPreview] = useState<RecursoType | null>(null)
  const [editando, setEditando] = useState<RecursoType | null>(null)
  const [tabActivo, setTabActivo] = useState<string | null>(null)

  async function handleDescargar(url: string, nombre: string) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = blobUrl; a.download = nombre; a.click()
      URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(url, "_blank")
    }
  }

  async function handleEliminar(documentId: string, nombre: string) {
    if (!window.confirm(`¿Eliminar "${nombre}"?`)) return
    setEliminando(documentId)
    try { await deleteRecurso(documentId); reload() }
    catch (e) { toast.error(`Error · ${(e as Error).message}`) }
    finally { setEliminando(null) }
  }

  async function handleReordenarRecursos(idsEnOrden: string[]) {
    try {
      await Promise.all(idsEnOrden.map((id, i) => updateRecurso(id, { orden: i })))
      reload()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "No se pudo reordenar")
    }
  }

  async function handleReordenarCategorias(idsEnOrden: string[]) {
    try {
      await Promise.all(idsEnOrden.map((nombre, i) => {
        const persistida = categoriasPersistidas.find(c => c.nombre === nombre)
        return persistida ? updateRecursoCategoria(persistida.documentId, { orden: i }) : createRecursoCategoria(nombre, seccion, i)
      }))
      reloadCategorias()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "No se pudo reordenar")
    }
  }

  async function handleEliminarCategoria(id: string) {
    const persistida = categoriasPersistidas.find(c => c.nombre === id)
    if (!persistida) return
    if (!window.confirm(`¿Eliminar la categoría "${id}"? Está vacía, no tiene recursos.`)) return
    try {
      await deleteRecursoCategoria(persistida.documentId)
      if (tabActivo === id) setTabActivo("")
      reloadCategorias()
      toast.success("Categoría eliminada")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar")
    }
  }

  async function handleRenombrarValor(campo: "categoria" | "tipo" | "variante", valorViejo: string, valorNuevo: string) {
    if (!valorNuevo || valorNuevo === valorViejo) return
    const afectados = recursos.filter(r => r[campo] === valorViejo)
    const categoriaPersistida = campo === "categoria" ? categoriasPersistidas.find(c => c.nombre === valorViejo) : undefined
    const yaExiste = recursos.some(r => r[campo] === valorNuevo) || (campo === "categoria" && categoriasPersistidas.some(c => c.nombre === valorNuevo))
    const sufijo = afectados.length > 0 ? ` en ${afectados.length} recurso${afectados.length === 1 ? "" : "s"}` : ""
    const mensaje = yaExiste
      ? `"${valorNuevo}" ya existe. Esto va a fusionar "${valorViejo}" con "${valorNuevo}"${sufijo}. ¿Continuar?`
      : `¿Renombrar "${valorViejo}" a "${valorNuevo}"${sufijo}?`
    if ((afectados.length > 0 || categoriaPersistida || yaExiste) && !window.confirm(mensaje)) return

    try {
      await Promise.all(afectados.map(r => updateRecurso(r.documentId, { [campo]: valorNuevo })))
      if (categoriaPersistida) {
        await updateRecursoCategoria(categoriaPersistida.documentId, { nombre: valorNuevo })
        reloadCategorias()
      }
      if (campo === "categoria" && tabActivo === valorViejo) setTabActivo(valorNuevo)
      reload()
      toast.success("Renombrado correctamente")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "No se pudo renombrar")
    }
  }

  const categoriasDinamicas: { id: string; orden: number }[] = []
  const vistos = new Set<string>()
  const conteoRecursos: Record<string, number> = {}
  for (const r of recursos) {
    if (r.categoria) {
      conteoRecursos[r.categoria] = (conteoRecursos[r.categoria] ?? 0) + 1
      if (!vistos.has(r.categoria)) { vistos.add(r.categoria); categoriasDinamicas.push({ id: r.categoria, orden: r.orden }) }
    }
  }
  if (layout === "sidebar") {
    for (const c of categoriasPersistidas) {
      const existente = categoriasDinamicas.find(cd => cd.id === c.nombre)
      if (existente) existente.orden = c.orden
      else { vistos.add(c.nombre); categoriasDinamicas.push({ id: c.nombre, orden: c.orden }) }
    }
  }
  const tabs: TabDef[] = [
    ...categoriasDinamicas.map(c => ({ id: c.id, label: c.id, orden: c.orden, esExtra: false }) as TabDef),
    ...extraTabs.map(t => ({ id: t.id, label: t.label, icon: t.icon, orden: t.orden, esExtra: true, content: t.content }) as TabDef),
  ].sort((a, b) => a.orden - b.orden)

  const modoTabs = tabs.length > 0
  const verHuerfanos = layout === "sidebar" && tabActivo === HUERFANOS_ID
  const activo = (modoTabs && !verHuerfanos) ? (tabs.find(t => t.id === tabActivo) ?? tabs[0]) : null
  const esExtra = activo?.esExtra ?? false
  const huerfanos = layout === "sidebar" ? recursos.filter(r => !r.categoria) : []

  const recursosVisibles = verHuerfanos ? huerfanos : !modoTabs ? recursos : esExtra ? [] : recursos.filter(r => r.categoria === activo?.id)
  const cargandoInicial = layout === "sidebar" && loading && recursos.length === 0

  if (!modoTabs && !cargandoInicial && recursos.length === 0 && !puedeSubir) return (
    <Card>
      <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2">Recursos descargables</h2>
      <p className="text-xs text-slate-400 dark:text-slate-500">Sin recursos disponibles en esta sección aún.</p>
    </Card>
  )

  return (
    <>
      <Card>
        {layout !== "sidebar" && (
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Recursos descargables</h2>
            {puedeSubir && (
              <button type="button" onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold rounded-lg transition-colors">
                <Plus className="h-3 w-3" /> Subir recurso
              </button>
            )}
          </div>
        )}

        {cargandoInicial ? (
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="hidden lg:flex lg:w-48 shrink-0 flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 rounded-lg" />)}</div>
            <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-3 gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-video rounded-xl" />)}</div>
          </div>
        ) : layout === "sidebar" ? (
          modoTabs ? (
            <div className="flex flex-col lg:flex-row gap-4">
              <aside className="hidden lg:block lg:w-48 shrink-0 lg:border-r lg:border-slate-200 dark:lg:border-slate-700 lg:pr-3">
                <SidebarNav tabs={tabs} activo={verHuerfanos ? HUERFANOS_ID : activo!.id} onSelect={setTabActivo}
                  onCrear={puedeSubir ? () => setCrearCategoriaOpen(true) : undefined}
                  huerfanos={puedeSubir ? huerfanos.length : 0} verHuerfanos={verHuerfanos}
                  onVerHuerfanos={() => setTabActivo(HUERFANOS_ID)}
                  onReordenar={puedeSubir ? handleReordenarCategorias : undefined}
                  conteos={conteoRecursos} onEliminarCategoria={puedeSubir ? handleEliminarCategoria : undefined} />
              </aside>
              <div className="lg:hidden flex items-center gap-2">
                <select aria-label="Recursos" value={verHuerfanos ? HUERFANOS_ID : activo!.id} onChange={e => setTabActivo(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-violet-400 transition-colors">
                  {tabs.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  {puedeSubir && huerfanos.length > 0 && <option value={HUERFANOS_ID}>⚠ Sin categoría ({huerfanos.length})</option>}
                </select>
                {puedeSubir && (
                  <button type="button" onClick={() => setCrearCategoriaOpen(true)} title="Nueva categoría" aria-label="Nueva categoría"
                    className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors">
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex-1 min-w-0">
                {esExtra ? (
                  <div>
                    {puedeSubir && (
                      <div className="flex justify-end mb-3">
                        <button type="button" onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold rounded-lg transition-colors">
                          <Plus className="h-3 w-3" /> Subir recurso
                        </button>
                      </div>
                    )}
                    {activo?.content}
                  </div>
                ) : (
                  <CategoriaFileGrid key={verHuerfanos ? HUERFANOS_ID : activo?.id} recursos={recursosVisibles}
                    puedeSubir={puedeSubir} eliminando={eliminando}
                    onPreview={setPreview} onDescargar={handleDescargar}
                    onEliminar={handleEliminar} onEditar={setEditando}
                    onSubir={() => setModalOpen(true)} onRenombrar={handleRenombrarValor}
                    onReordenar={handleReordenarRecursos} />
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-2">
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">Sin recursos en esta sección aún.</p>
              {puedeSubir && (
                <button type="button" onClick={() => setCrearCategoriaOpen(true)} className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline">+ Crear una categoría</button>
              )}
            </div>
          )
        ) : (
          <>
            {modoTabs && (
              <div className="mb-3">
                <TabBar tabs={tabs.map(t => ({ id: t.id, label: t.label, icon: t.icon }))} active={activo!.id} onChange={setTabActivo} />
              </div>
            )}
            {esExtra ? (
              <div>{activo?.content}</div>
            ) : recursosVisibles.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">Sin recursos {modoTabs ? "en esta pestaña" : "en esta sección"} aún.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {agruparRecursos(recursosVisibles).map(([key, variantes]) => (
                  <RecursoCard key={key} variantes={variantes} puedeSubir={puedeSubir} eliminando={eliminando}
                    onPreview={setPreview} onDescargar={handleDescargar} onEliminar={handleEliminar} onEditar={setEditando} />
                ))}
              </div>
            )}
          </>
        )}
        {hayMas && (
          <div className="flex justify-center pt-4">
            <button type="button" onClick={cargarMas} disabled={cargandoMas} className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline disabled:opacity-50">
              {cargandoMas ? "Cargando…" : "Cargar más recursos"}
            </button>
          </div>
        )}
      </Card>

      {preview && (
        <PreviewModal recurso={preview} onClose={() => setPreview(null)}
          onDescargar={() => { if (preview.archivo?.url) handleDescargar(preview.archivo.url, preview.nombre) }}
          onEditar={puedeSubir ? () => { setEditando(preview); setPreview(null) } : undefined} />
      )}

      {modalOpen && (
        <SubirRecursoModal seccionDefault={seccion} categoriaDefault={modoTabs && !esExtra ? activo?.id : undefined}
          categoriasExistentes={categoriasDinamicas.map(c => c.id)} recursosExistentes={recursos}
          onClose={() => setModalOpen(false)} onSubido={reload} onRenombrar={handleRenombrarValor} />
      )}

      {crearCategoriaOpen && (
        <CrearCategoriaModal seccion={seccion} orden={categoriasDinamicas.length} onClose={() => setCrearCategoriaOpen(false)}
          onCreada={nombre => { reloadCategorias(); setTabActivo(nombre) }} />
      )}

      {editando && (
        <EditarRecursoModal recurso={editando} categoriasExistentes={categoriasDinamicas.map(c => c.id)} recursosExistentes={recursos}
          onClose={() => setEditando(null)} onEditado={reload} onRenombrar={handleRenombrarValor} />
      )}
    </>
  )
}
