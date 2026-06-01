"use client"

import { useState, useMemo } from "react"
import {
  Plus, Pencil, Trash2, X, Check,
  ExternalLink, ArrowUp, ArrowDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useGetCampanas } from "@/api/campana/getCampanas"
import { createCampana, updateCampana, deleteCampana } from "@/api/campana/mutateCampana"
import { CampanaType, CampanaPayload, MESES, MesCampana, TipoCampana } from "@/types/campana"

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SEMANAS = [1, 2, 3, 4] as const
type NSemana = typeof SEMANAS[number]

const ANIO_ACTUAL = new Date().getFullYear()

const fmtFecha = (iso: string | null) => {
  if (!iso) return null
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" })
}

function semanaVal(c: CampanaType, n: NSemana, campo: "Fecha" | "Titulo" | "Partes" | "Archivo") {
  return c[`semana${n}${campo}` as keyof CampanaType] as string | null
}

function emptyForm(): CampanaPayload {
  return {
    unidadNegocio: "", mes: "Enero", anio: ANIO_ACTUAL,
    tipo: "completa", orden: 0,
    categoria: null, atributos: null,
    semana1Fecha: null, semana1Titulo: null, semana1Partes: null, semana1Archivo: null,
    semana2Fecha: null, semana2Titulo: null, semana2Partes: null, semana2Archivo: null,
    semana3Fecha: null, semana3Titulo: null, semana3Partes: null, semana3Archivo: null,
    semana4Fecha: null, semana4Titulo: null, semana4Partes: null, semana4Archivo: null,
    notas: null,
  }
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function ArchivoLink({ url }: { url: string | null }) {
  if (!url?.trim()) return null
  if (!url.startsWith("http")) return <span className="text-[10px] text-slate-400 break-all">{url}</span>
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 hover:underline">
      <ExternalLink size={9} /> Ver archivo
    </a>
  )
}

function ListaPartes({ texto }: { texto: string | null }) {
  if (!texto?.trim()) return null
  return (
    <ul className="space-y-0.5 mt-1">
      {texto.trim().split("\n").filter(Boolean).map((p, i) => (
        <li key={i} className="text-[11px] text-slate-300 leading-snug">{p}</li>
      ))}
    </ul>
  )
}

// ─── Celda de semana con edición inline ──────────────────────────────────────

function SemanaCell({
  c, n, onSave, esExtra = false,
}: {
  c: CampanaType
  n: NSemana
  onSave: (fields: Partial<CampanaPayload>) => Promise<void>
  esExtra?: boolean
}) {
  const [editando, setEditando] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [fFecha,   setFFecha]   = useState("")
  const [fTitulo,  setFTitulo]  = useState("")
  const [fPartes,  setFPartes]  = useState("")
  const [fArchivo, setFArchivo] = useState("")

  const fecha   = semanaVal(c, n, "Fecha")
  const titulo  = semanaVal(c, n, "Titulo")
  const partes  = semanaVal(c, n, "Partes")
  const archivo = semanaVal(c, n, "Archivo")

  const abrir = () => {
    setFFecha(fecha ?? ""); setFTitulo(titulo ?? "")
    setFPartes(partes ?? ""); setFArchivo(archivo ?? "")
    setEditando(true)
  }

  const guardar = async () => {
    setSaving(true)
    try {
      await onSave({
        [`semana${n}Fecha`]:   fFecha   || null,
        [`semana${n}Titulo`]:  fTitulo  || null,
        [`semana${n}Partes`]:  fPartes  || null,
        [`semana${n}Archivo`]: fArchivo || null,
      } as Partial<CampanaPayload>)
      setEditando(false)
    } finally { setSaving(false) }
  }

  // ── Modo edición ────────────────────────────────────────────────────────────
  if (editando) {
    return (
      <div className={`p-3 space-y-2 m-1 rounded-lg border-2 ${esExtra ? "border-amber-700/50 bg-amber-950/10" : "border-blue-700/50 bg-slate-800/60"}`}>
        <p className={`text-[10px] font-bold uppercase tracking-wider ${esExtra ? "text-amber-400" : "text-blue-400"}`}>
          Semana {n}
        </p>
        <input type="date" title="Fecha de la semana" value={fFecha} onChange={e => setFFecha(e.target.value)}
          className="w-full text-xs rounded border border-slate-700 bg-slate-800 text-slate-200 px-2 py-1 outline-none focus:border-slate-500" />
        <input autoFocus value={fTitulo} onChange={e => setFTitulo(e.target.value)}
          placeholder="Título..." onKeyDown={e => { if (e.key === "Escape") setEditando(false) }}
          className="w-full text-xs rounded border border-slate-700 bg-slate-800 text-slate-200 px-2 py-1 outline-none focus:border-slate-500" />
        {esExtra ? (
          <textarea value={fPartes} onChange={e => setFPartes(e.target.value)}
            placeholder={"Título extra 1\nTítulo extra 2"} rows={3}
            className="w-full text-xs rounded border border-amber-800/40 bg-amber-950/10 text-slate-100 px-2 py-1 resize-none placeholder:text-slate-600 outline-none" />
        ) : (
          <>
            <textarea value={fPartes} onChange={e => setFPartes(e.target.value)}
              placeholder={"Parte 1\nParte 2"} rows={2}
              className="w-full text-xs rounded border border-slate-700 bg-slate-800 text-slate-200 px-2 py-1 resize-none placeholder:text-slate-600 outline-none focus:border-slate-500" />
            <input value={fArchivo} onChange={e => setFArchivo(e.target.value)}
              placeholder="Link del archivo..."
              className="w-full text-xs rounded border border-slate-700 bg-slate-800 text-slate-200 px-2 py-1 outline-none focus:border-slate-500" />
          </>
        )}
        <div className="flex gap-1.5">
          <button type="button" onClick={guardar} disabled={saving}
            className={`flex items-center justify-center gap-1 flex-1 text-xs py-1.5 rounded text-white transition disabled:opacity-50 ${
              esExtra ? "bg-amber-700 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-500"
            }`}>
            <Check size={11} /> {saving ? "Guardando..." : "Guardar"}
          </button>
          <button type="button" title="Cancelar" onClick={() => setEditando(false)}
            className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-300 rounded border border-slate-700 transition">
            <X size={11} />
          </button>
        </div>
      </div>
    )
  }

  // ── Modo vista: titulos_extra ───────────────────────────────────────────────
  if (esExtra) {
    const extras  = partes?.trim().split("\n").filter(Boolean) ?? []
    const hayContenido = !!(titulo || extras.length > 0)
    return (
      <div className={`px-3 py-2.5 group relative ${!hayContenido ? "opacity-30" : ""}`}>
        <p className="text-[9px] font-semibold text-amber-600/70 uppercase tracking-wider">Semana {n}</p>
        {fecha && <p className="text-[9px] text-slate-600 mb-1">{fmtFecha(fecha)}</p>}
        {hayContenido ? (
          <ul className="space-y-0.5 mt-0.5">
            {titulo && <li className="text-[11px] text-amber-100/90 leading-snug font-medium">{titulo}</li>}
            {extras.map((t, i) => <li key={i} className="text-[11px] text-amber-100/60 leading-snug">{t}</li>)}
          </ul>
        ) : (
          <button type="button" onClick={abrir}
            className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-amber-500 transition mt-1">
            <Plus size={10} /> Agregar
          </button>
        )}
        {hayContenido && (
          <button type="button" onClick={abrir} title="Editar semana"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-amber-400 rounded hover:bg-slate-800 transition">
            <Pencil size={10} />
          </button>
        )}
      </div>
    )
  }

  // ── Modo vista: completa ────────────────────────────────────────────────────
  const tieneContenido = !!(titulo || partes || archivo)
  return (
    <div className={`p-3 space-y-1.5 group relative ${!tieneContenido ? "opacity-30" : ""}`}>
      <div>
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Semana {n}</p>
        {fecha && <p className="text-[9px] text-slate-600 mt-0.5">{fmtFecha(fecha)}</p>}
      </div>
      {titulo && <p className="text-[11px] font-medium text-slate-200 leading-snug">{titulo}</p>}
      {partes && (
        <div>
          <p className="text-[9px] text-slate-600 uppercase mb-0.5">Partes / Productos</p>
          <ListaPartes texto={partes} />
        </div>
      )}
      {archivo && <ArchivoLink url={archivo} />}
      {!tieneContenido ? (
        <button type="button" onClick={abrir}
          className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition mt-1">
          <Plus size={10} /> Agregar
        </button>
      ) : (
        <button type="button" onClick={abrir} title="Editar semana"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-slate-300 rounded hover:bg-slate-800 transition">
          <Pencil size={10} />
        </button>
      )}
    </div>
  )
}

// ─── Tarjeta campaña completa ─────────────────────────────────────────────────

function CampanaCompletaCard({
  c, onEdit, onDelete, onMover, esPrimera, esUltima, onSaveSemana,
}: {
  c: CampanaType
  onEdit: () => void
  onDelete: () => void
  onMover: (dir: "arriba" | "abajo") => void
  esPrimera: boolean
  esUltima: boolean
  onSaveSemana: (fields: Partial<CampanaPayload>) => Promise<void>
}) {
  const atributos = c.atributos?.split("\n").filter(Boolean) ?? []

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-800/60">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-100">{c.unidadNegocio}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/20">
              {c.mes} {c.anio}
            </span>
            {c.categoria && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/20">
                {c.categoria}
              </span>
            )}
          </div>
          {atributos.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {atributos.map((a, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">{a}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button type="button" onClick={() => onMover("arriba")} disabled={esPrimera}
            className="p-1.5 text-slate-600 hover:text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed rounded hover:bg-slate-800 transition" title="Mover arriba">
            <ArrowUp size={12} />
          </button>
          <button type="button" onClick={() => onMover("abajo")} disabled={esUltima}
            className="p-1.5 text-slate-600 hover:text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed rounded hover:bg-slate-800 transition" title="Mover abajo">
            <ArrowDown size={12} />
          </button>
          <button type="button" onClick={onEdit} title="Editar campaña" className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition ml-1">
            <Pencil size={13} />
          </button>
          <button type="button" onClick={onDelete} title="Eliminar" className="p-1.5 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800 transition">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-800/60">
        {SEMANAS.map(n => (
          <SemanaCell key={n} c={c} n={n} onSave={onSaveSemana} />
        ))}
      </div>

      {c.notas && (
        <div className="px-4 py-2 border-t border-slate-800/60">
          <p className="text-[11px] text-slate-500">{c.notas}</p>
        </div>
      )}
    </div>
  )
}

// ─── Tarjeta títulos extra ────────────────────────────────────────────────────

function CampanaTitulosCard({
  c, onEdit, onDelete, onMover, esPrimera, esUltima, onSaveSemana,
}: {
  c: CampanaType
  onEdit: () => void
  onDelete: () => void
  onMover: (dir: "arriba" | "abajo") => void
  esPrimera: boolean
  esUltima: boolean
  onSaveSemana: (fields: Partial<CampanaPayload>) => Promise<void>
}) {
  return (
    <div className="bg-slate-900 border border-amber-800/40 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-amber-800/30 bg-amber-950/20">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wide">Títulos extra</span>
          <span className="text-xs font-bold text-slate-100">{c.unidadNegocio}</span>
          {c.categoria && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {c.categoria}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button type="button" onClick={() => onMover("arriba")} disabled={esPrimera}
            className="p-1.5 text-slate-600 hover:text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed rounded hover:bg-slate-800 transition" title="Mover arriba">
            <ArrowUp size={12} />
          </button>
          <button type="button" onClick={() => onMover("abajo")} disabled={esUltima}
            className="p-1.5 text-slate-600 hover:text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed rounded hover:bg-slate-800 transition" title="Mover abajo">
            <ArrowDown size={12} />
          </button>
          <button type="button" onClick={onEdit} title="Editar" className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition ml-1">
            <Pencil size={13} />
          </button>
          <button type="button" onClick={onDelete} title="Eliminar" className="p-1.5 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800 transition">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-800/40">
        {SEMANAS.map(n => (
          <SemanaCell key={n} c={c} n={n} onSave={onSaveSemana} esExtra />
        ))}
      </div>
    </div>
  )
}

// ─── Campos de semana en el formulario ───────────────────────────────────────

function SemanaFields({
  n, form, setForm, soloTitulo,
}: {
  n: NSemana
  form: CampanaPayload
  setForm: React.Dispatch<React.SetStateAction<CampanaPayload>>
  soloTitulo: boolean
}) {
  const fechaKey   = `semana${n}Fecha`   as keyof CampanaPayload
  const tituloKey  = `semana${n}Titulo`  as keyof CampanaPayload
  const partesKey  = `semana${n}Partes`  as keyof CampanaPayload
  const archivoKey = `semana${n}Archivo` as keyof CampanaPayload

  return (
    <div className={`border rounded-lg p-3 space-y-2 ${soloTitulo ? "border-amber-800/40 bg-amber-950/10" : "border-slate-700"}`}>
      <p className={`text-[11px] font-semibold uppercase tracking-wide ${soloTitulo ? "text-amber-500/70" : "text-slate-400"}`}>
        Semana {n}
      </p>
      <div>
        <Label className="text-[10px] text-slate-500">Fecha</Label>
        <Input type="date" value={(form[fechaKey] as string) ?? ""}
          onChange={e => setForm(f => ({ ...f, [fechaKey]: e.target.value || null }))}
          className="h-8 text-xs bg-slate-800 border-slate-700 text-slate-100" />
      </div>
      <div>
        <Label className="text-[10px] text-slate-500">Título</Label>
        <Input value={(form[tituloKey] as string) ?? ""}
          onChange={e => setForm(f => ({ ...f, [tituloKey]: e.target.value || null }))}
          placeholder={`Título semana ${n}...`}
          className="h-8 text-xs bg-slate-800 border-slate-700 text-slate-100" />
      </div>
      {soloTitulo && (
        <div>
          <Label className="text-[10px] text-amber-500/70">Títulos adicionales (uno por línea)</Label>
          <textarea
            value={(form[partesKey] as string) ?? ""}
            onChange={e => setForm(f => ({ ...f, [partesKey]: e.target.value || null }))}
            placeholder={"Título extra 1\nTítulo extra 2\nTítulo extra 3"}
            rows={3}
            className="w-full text-xs rounded-md border border-amber-800/40 bg-amber-950/10 text-slate-100 px-3 py-2 resize-y placeholder:text-slate-600"
          />
        </div>
      )}
      {!soloTitulo && (
        <>
          <div>
            <Label className="text-[10px] text-slate-500">Partes / Productos</Label>
            <textarea
              value={(form[partesKey] as string) ?? ""}
              onChange={e => setForm(f => ({ ...f, [partesKey]: e.target.value || null }))}
              placeholder={"UK6A-DN-0E (Stock) - Ultrasónico\nFFRL-BN-1E (Stock) - Fotoeléctrico"}
              rows={3}
              className="w-full text-xs rounded-md border border-slate-700 bg-slate-800 text-slate-100 px-3 py-2 resize-y placeholder:text-slate-600"
            />
          </div>
          <div>
            <Label className="text-[10px] text-slate-500">Link del archivo</Label>
            <Input value={(form[archivoKey] as string) ?? ""}
              onChange={e => setForm(f => ({ ...f, [archivoKey]: e.target.value || null }))}
              placeholder="https://sharepoint.com/..."
              className="h-8 text-xs bg-slate-800 border-slate-700 text-slate-100" />
          </div>
        </>
      )}
    </div>
  )
}

// ─── Vista principal ──────────────────────────────────────────────────────────

export function CampanasView() {
  const { campanas, setCampanas, loading } = useGetCampanas()
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando]   = useState<CampanaType | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm]           = useState<CampanaPayload>(emptyForm())

  const [filtroMes, setFiltroMes]             = useState<MesCampana | "">("")
  const [filtroAnio, setFiltroAnio]           = useState<number | "">(ANIO_ACTUAL)
  const [filtroUnidad, setFiltroUnidad]       = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState("")

  const unidadesUsadas   = useMemo(() => [...new Set(campanas.map(c => c.unidadNegocio).filter(Boolean))].sort(), [campanas])
  const categoriasUsadas = useMemo(() => [...new Set(campanas.map(c => c.categoria).filter(Boolean))].sort() as string[], [campanas])
  const aniosUsados      = useMemo(() => [...new Set(campanas.map(c => c.anio))].sort((a, b) => b - a), [campanas])

  const filtradas = useMemo(() =>
    campanas
      .filter(c => !filtroMes       || c.mes === filtroMes)
      .filter(c => !filtroAnio      || c.anio === filtroAnio)
      .filter(c => !filtroUnidad    || c.unidadNegocio === filtroUnidad)
      .filter(c => !filtroCategoria || c.categoria === filtroCategoria),
  [campanas, filtroMes, filtroAnio, filtroUnidad, filtroCategoria])

  const porMes = useMemo(() => {
    const map = new Map<string, CampanaType[]>()
    filtradas.forEach(c => {
      const key = `${c.mes} ${c.anio}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(c)
    })
    return [...map.entries()]
      .map(([key, items]) => [
        key,
        [...items].sort((a, b) => a.orden - b.orden || new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()),
      ] as [string, CampanaType[]])
      .sort(([a], [b]) => {
        const [mesA, anioA] = a.split(" ")
        const [mesB, anioB] = b.split(" ")
        const hoy = new Date()
        const hoyAbs = hoy.getFullYear() * 12 + hoy.getMonth()
        const absA = Number(anioA) * 12 + MESES.indexOf(mesA as MesCampana)
        const absB = Number(anioB) * 12 + MESES.indexOf(mesB as MesCampana)
        const dA = absA - hoyAbs  // positivo = futuro/actual, negativo = pasado
        const dB = absB - hoyAbs
        // futuro/actual antes que pasado; dentro de cada grupo, más próximo primero
        if (dA >= 0 && dB < 0) return -1
        if (dA < 0 && dB >= 0) return 1
        return dA - dB
      })
  }, [filtradas])

  // ── Reordenar ──────────────────────────────────────────────────────────────
  const reordenar = async (documentId: string, grupoKey: string, dir: "arriba" | "abajo") => {
    const grupo = porMes.find(([k]) => k === grupoKey)?.[1] ?? []
    const idx = grupo.findIndex(c => c.documentId === documentId)
    if (dir === "arriba" && idx === 0) return
    if (dir === "abajo" && idx === grupo.length - 1) return

    const swapIdx   = dir === "arriba" ? idx - 1 : idx + 1
    const target    = grupo[idx]
    const other     = grupo[swapIdx]
    const newOrdenA = swapIdx * 10
    const newOrdenB = idx * 10

    // Optimistic update
    setCampanas(prev => prev.map(c => {
      if (c.documentId === target.documentId) return { ...c, orden: newOrdenA }
      if (c.documentId === other.documentId)  return { ...c, orden: newOrdenB }
      return c
    }))

    try {
      await Promise.all([
        updateCampana(target.documentId, { orden: newOrdenA }),
        updateCampana(other.documentId,  { orden: newOrdenB }),
      ])
    } catch {
      // Revert
      setCampanas(prev => prev.map(c => {
        if (c.documentId === target.documentId) return { ...c, orden: target.orden }
        if (c.documentId === other.documentId)  return { ...c, orden: other.orden }
        return c
      }))
      toast.error("Error al reordenar")
    }
  }

  // ── Modal ──────────────────────────────────────────────────────────────────
  const abrirCrear = (tipo: TipoCampana = "completa") => {
    setEditando(null)
    setForm({ ...emptyForm(), tipo })
    setModalOpen(true)
  }

  const abrirEditar = (c: CampanaType) => {
    setEditando(c)
    setForm({
      unidadNegocio: c.unidadNegocio, mes: c.mes, anio: c.anio,
      tipo: c.tipo, orden: c.orden,
      categoria: c.categoria, atributos: c.atributos,
      semana1Fecha: c.semana1Fecha, semana1Titulo: c.semana1Titulo, semana1Partes: c.semana1Partes, semana1Archivo: c.semana1Archivo,
      semana2Fecha: c.semana2Fecha, semana2Titulo: c.semana2Titulo, semana2Partes: c.semana2Partes, semana2Archivo: c.semana2Archivo,
      semana3Fecha: c.semana3Fecha, semana3Titulo: c.semana3Titulo, semana3Partes: c.semana3Partes, semana3Archivo: c.semana3Archivo,
      semana4Fecha: c.semana4Fecha, semana4Titulo: c.semana4Titulo, semana4Partes: c.semana4Partes, semana4Archivo: c.semana4Archivo,
      notas: c.notas,
    })
    setModalOpen(true)
  }

  const guardar = async () => {
    if (!form.unidadNegocio.trim()) { toast.error("La unidad de negocio es obligatoria"); return }
    setGuardando(true)
    try {
      if (editando) {
        const updated = await updateCampana(editando.documentId, form)
        setCampanas(prev => prev.map(c => c.documentId === updated.documentId ? updated : c))
        toast.success("Campaña actualizada")
      } else {
        // Assign orden = last in the group + 10
        const grupoKey = `${form.mes} ${form.anio}`
        const grupo = porMes.find(([k]) => k === grupoKey)?.[1] ?? []
        const maxOrden = grupo.length > 0 ? Math.max(...grupo.map(c => c.orden)) : -10
        const nueva = await createCampana({ ...form, orden: maxOrden + 10 })
        setCampanas(prev => [...prev, nueva])
        toast.success("Campaña creada")
      }
      setModalOpen(false)
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  const borrar = async (c: CampanaType) => {
    if (!confirm(`¿Eliminar "${c.unidadNegocio} · ${c.mes} ${c.anio}"?`)) return
    try {
      await deleteCampana(c.documentId)
      setCampanas(prev => prev.filter(x => x.documentId !== c.documentId))
      toast.success("Campaña eliminada")
    } catch {
      toast.error("Error al eliminar")
    }
  }

  const saveSemana = async (documentId: string, fields: Partial<CampanaPayload>) => {
    const original = campanas.find(c => c.documentId === documentId)
    setCampanas(prev => prev.map(c => c.documentId === documentId ? { ...c, ...fields } : c))
    try {
      const updated = await updateCampana(documentId, fields)
      setCampanas(prev => prev.map(c => c.documentId === updated.documentId ? updated : c))
    } catch {
      if (original) setCampanas(prev => prev.map(c => c.documentId === documentId ? original : c))
      toast.error("Error al guardar semana")
      throw new Error("Error al guardar semana")
    }
  }

  const soloTitulo = form.tipo === "titulos_extra"

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Campañas</h1>
          <p className="text-sm text-slate-500">Programación mensual por unidad de negocio</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => abrirCrear("titulos_extra")} size="sm" variant="outline"
            className="border-amber-700/50 text-amber-400 hover:bg-amber-950/30 hover:text-amber-300">
            <Plus size={14} className="mr-1" /> Títulos extra
          </Button>
          <Button onClick={() => abrirCrear("completa")} size="sm"
            className="bg-blue-600 hover:bg-blue-500 text-white">
            <Plus size={14} className="mr-1" /> Nueva campaña
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        <select title="Año" value={filtroAnio}
          onChange={e => setFiltroAnio(e.target.value ? Number(e.target.value) : "")}
          className="text-xs px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300">
          <option value="">Todos los años</option>
          {aniosUsados.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select title="Mes" value={filtroMes}
          onChange={e => setFiltroMes(e.target.value as MesCampana | "")}
          className="text-xs px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300">
          <option value="">Todos los meses</option>
          {MESES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        {unidadesUsadas.length > 0 && (
          <select title="Unidad" value={filtroUnidad}
            onChange={e => setFiltroUnidad(e.target.value)}
            className="text-xs px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300">
            <option value="">Todas las unidades</option>
            {unidadesUsadas.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        )}
        {categoriasUsadas.length > 0 && (
          <select title="Categoría" value={filtroCategoria}
            onChange={e => setFiltroCategoria(e.target.value)}
            className="text-xs px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300">
            <option value="">Todas las categorías</option>
            {categoriasUsadas.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        {(filtroMes || filtroUnidad || filtroCategoria) && (
          <button type="button"
            onClick={() => { setFiltroMes(""); setFiltroUnidad(""); setFiltroCategoria("") }}
            className="text-xs px-2 py-1.5 text-slate-500 hover:text-slate-300">
            Limpiar
          </button>
        )}
      </div>

      {/* Contenido */}
      {loading ? (
        <p className="text-sm text-slate-500 text-center py-12">Cargando...</p>
      ) : campanas.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-slate-500 text-sm">No hay campañas registradas</p>
          <div className="flex items-center justify-center gap-2">
            <Button onClick={() => abrirCrear("completa")} size="sm" variant="outline">
              <Plus size={14} className="mr-1" /> Campaña completa
            </Button>
            <Button onClick={() => abrirCrear("titulos_extra")} size="sm" variant="outline"
              className="border-amber-700/50 text-amber-400">
              <Plus size={14} className="mr-1" /> Títulos extra
            </Button>
          </div>
        </div>
      ) : filtradas.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-12">Sin resultados con los filtros actuales.</p>
      ) : (
        <div className="space-y-8">
          {porMes.map(([mesAnio, items]) => (
            <div key={mesAnio}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-base font-bold text-slate-200">{mesAnio}</h2>
                <span className="text-[10px] text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">
                  {items.length} campaña{items.length !== 1 ? "s" : ""}
                </span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>
              <div className="space-y-3">
                {items.map((c, idx) =>
                  c.tipo === "titulos_extra" ? (
                    <CampanaTitulosCard key={c.documentId} c={c}
                      onEdit={() => abrirEditar(c)}
                      onDelete={() => borrar(c)}
                      onMover={dir => reordenar(c.documentId, mesAnio, dir)}
                      esPrimera={idx === 0}
                      esUltima={idx === items.length - 1}
                      onSaveSemana={fields => saveSemana(c.documentId, fields)}
                    />
                  ) : (
                    <CampanaCompletaCard key={c.documentId} c={c}
                      onEdit={() => abrirEditar(c)}
                      onDelete={() => borrar(c)}
                      onMover={dir => reordenar(c.documentId, mesAnio, dir)}
                      esPrimera={idx === 0}
                      esUltima={idx === items.length - 1}
                      onSaveSemana={fields => saveSemana(c.documentId, fields)}
                    />
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className={`border rounded-xl w-full max-w-2xl my-8 space-y-4 p-6 bg-slate-900 ${soloTitulo ? "border-amber-800/50" : "border-slate-700"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-100">
                  {editando ? "Editar campaña" : "Nueva campaña"}
                </h2>
                {soloTitulo && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                    Títulos extra
                  </span>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)} className="text-slate-400">
                <X size={16} />
              </Button>
            </div>

            {/* Tipo selector */}
            <div className="flex gap-2">
              {(["completa", "titulos_extra"] as TipoCampana[]).map(t => (
                <button key={t} type="button"
                  onClick={() => setForm(f => ({ ...f, tipo: t }))}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    form.tipo === t
                      ? t === "completa"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-amber-800/40 text-amber-300 border-amber-700/50"
                      : "border-slate-700 text-slate-500 hover:text-slate-300"
                  }`}>
                  {t === "completa" ? "Campaña completa" : "Títulos extra"}
                </button>
              ))}
            </div>

            {/* Datos generales */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-[10px] text-slate-500">Unidad de negocio *</Label>
                <Input list="unidades-campana" value={form.unidadNegocio}
                  onChange={e => setForm(f => ({ ...f, unidadNegocio: e.target.value }))}
                  placeholder="Store, MHS, etc."
                  className="h-9 bg-slate-800 border-slate-700 text-slate-100" />
                <datalist id="unidades-campana">
                  {unidadesUsadas.map(u => <option key={u} value={u} />)}
                </datalist>
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">Mes</Label>
                <select value={form.mes} aria-label="Mes"
                  onChange={e => setForm(f => ({ ...f, mes: e.target.value as MesCampana }))}
                  className="w-full h-9 rounded-md border border-slate-700 bg-slate-800 text-slate-100 px-3 text-sm">
                  {MESES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">Año</Label>
                <Input type="number" value={form.anio}
                  onChange={e => setForm(f => ({ ...f, anio: Number(e.target.value) }))}
                  className="h-9 bg-slate-800 border-slate-700 text-slate-100" />
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">Categoría de producto</Label>
                <Input list="categorias-campana" value={form.categoria ?? ""}
                  onChange={e => setForm(f => ({ ...f, categoria: e.target.value || null }))}
                  placeholder="Sensors, Spare Parts..."
                  className="h-9 bg-slate-800 border-slate-700 text-slate-100" />
                <datalist id="categorias-campana">
                  {categoriasUsadas.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              {!soloTitulo && (
                <div>
                  <Label className="text-[10px] text-slate-500">Atributos / Valor agregado</Label>
                  <textarea value={form.atributos ?? ""}
                    onChange={e => setForm(f => ({ ...f, atributos: e.target.value || null }))}
                    placeholder={"Tiempo de Entrega\nAsesoramiento Técnico"}
                    rows={3}
                    className="w-full text-xs rounded-md border border-slate-700 bg-slate-800 text-slate-100 px-3 py-2 resize-none placeholder:text-slate-600" />
                </div>
              )}
            </div>

            {/* Semanas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SEMANAS.map(n => (
                <SemanaFields key={n} n={n} form={form} setForm={setForm} soloTitulo={soloTitulo} />
              ))}
            </div>

            {!soloTitulo && (
              <div>
                <Label className="text-[10px] text-slate-500">Notas adicionales</Label>
                <Input value={form.notas ?? ""}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value || null }))}
                  placeholder="Observaciones..."
                  className="h-9 bg-slate-800 border-slate-700 text-slate-100" />
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}
                className="border-slate-700 text-slate-300">Cancelar</Button>
              <Button size="sm" onClick={guardar} disabled={guardando}
                className={soloTitulo ? "bg-amber-700 hover:bg-amber-600 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"}>
                <Check size={14} className="mr-1" />
                {guardando ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
