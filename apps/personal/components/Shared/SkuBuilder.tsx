"use client"

import { useState, useEffect, useRef } from "react"
import { Check, ChevronRight, Loader2, X, Plus } from "lucide-react"
import {
  MATERIALES_SKU, TIPOS_SKU, ESTILOS_SKU, TALLAS_SKU, EXTRAS_SKU, PIEDRAS_SKU,
  SkuEntry, buildSku, buildNombre,
} from "@/types/skuCatalogo"
import { addSku } from "@/api/catalogoJoyeria/getCatalogoJoyeria"
import { fetchSkuOpciones, createSkuOpcion, SkuOpcionRaw } from "@/api/skuOpciones/getSkuOpciones"

interface Props {
  defaultTipo?: string
  onAdd: (entry: SkuEntry) => void | Promise<void>
  onClose?: () => void
}

type Step = "mat" | "tipo" | "estilo" | "talla" | "extras"
const STEPS: Step[] = ["mat", "tipo", "estilo", "talla", "extras"]
const STEP_LABEL: Record<Step, string> = {
  mat: "Material", tipo: "Tipo", estilo: "Estilo", talla: "Talla", extras: "Extras",
}

// ── helpers de tipos desde opciones del servidor ────────────────────────────
function toMat(o: SkuOpcionRaw) {
  return { code: o.code, label: o.label, kind: ((o.meta?.kind as "gold" | "silv") ?? "silv") }
}
function toTipo(o: SkuOpcionRaw) {
  return { code: o.code, label: o.label, catJoya: ((o.meta?.catJoya as string) ?? o.label) }
}
function toEstilo(o: SkuOpcionRaw) {
  return { code: o.code, label: o.label }
}

// ── chip ────────────────────────────────────────────────────────────────────
function Chip({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
        active
          ? "bg-violet-600 border-violet-500 text-white shadow-sm shadow-violet-500/30"
          : "bg-slate-800/60 border-slate-700/50 text-slate-300 hover:border-violet-500/40 hover:text-violet-300"
      }`}>
      {label}
    </button>
  )
}

// ── botón "+" que abre mini-form ─────────────────────────────────────────────
function AddBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-0.5 h-6 px-1.5 text-[9px] font-medium text-slate-600
                 hover:text-violet-400 border border-dashed border-slate-700 hover:border-violet-500/40
                 rounded transition-colors">
      <Plus size={8} /> nuevo
    </button>
  )
}

// ── mini-form inline ─────────────────────────────────────────────────────────
function MiniForm({
  placeholder, onSave, onCancel, extraField,
}: {
  placeholder: string
  onSave: (label: string, extra?: string) => void
  onCancel: () => void
  extraField?: { label: string; options: { value: string; label: string }[] }
}) {
  const [val, setVal] = useState("")
  const [extra, setExtra] = useState(extraField?.options[0]?.value ?? "")
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => { ref.current?.focus() }, [])

  return (
    <form className="flex items-center gap-1.5 mt-2 flex-wrap"
      onSubmit={e => { e.preventDefault(); if (val.trim()) onSave(val.trim(), extra) }}>
      <input ref={ref} value={val} onChange={e => setVal(e.target.value)}
        placeholder={placeholder} maxLength={40}
        className="h-7 px-2 text-xs bg-slate-800 border border-violet-500/40 rounded
                   text-slate-200 outline-none focus:border-violet-500 min-w-[140px] flex-1"/>
      {extraField && (
        <select value={extra} onChange={e => setExtra(e.target.value)}
          className="h-7 px-1.5 text-xs bg-slate-800 border border-slate-700 rounded text-slate-300 outline-none">
          {extraField.options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}
      <button type="submit"
        className="h-7 px-2.5 text-[10px] font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded transition-colors">
        OK
      </button>
      <button type="button" onClick={onCancel}
        className="h-7 px-2 text-[10px] text-slate-500 hover:text-slate-300 transition-colors">
        ✕
      </button>
    </form>
  )
}

// ── componente principal ─────────────────────────────────────────────────────
export function SkuBuilder({ defaultTipo, onAdd, onClose }: Props) {
  const [mat,    setMat]    = useState<typeof MATERIALES_SKU[number] | null>(null)
  const [tipo,   setTipo]   = useState<typeof TIPOS_SKU[number] | null>(
    defaultTipo ? (TIPOS_SKU.find(t => t.code === defaultTipo) ?? null) : null
  )
  const [estilo, setEstilo] = useState<{ code: string; label: string } | null>(null)
  const [talla,  setTalla]  = useState<string>("")
  const [extras, setExtras] = useState<string[]>([])
  const [piedra, setPiedra] = useState<string>("")
  const [saving, setSaving] = useState(false)

  // ── opciones del servidor ──────────────────────────────────────────────────
  const [serverOps, setServerOps] = useState<SkuOpcionRaw[]>([])
  const [loaded,    setLoaded]    = useState(false)

  useEffect(() => {
    fetchSkuOpciones().then(ops => { setServerOps(ops); setLoaded(true) })
  }, [])

  // ── mini-form "+" ──────────────────────────────────────────────────────────
  type AddingStep = "mat" | "tipo" | "estilo" | "talla" | "extra" | null
  const [addingTo,   setAddingTo]   = useState<AddingStep>(null)
  const [saveWarn,   setSaveWarn]   = useState<string | null>(null)

  async function handleAdd(step: AddingStep, label: string, extra?: string) {
    if (!label || !step) return
    const code = label.toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g,"")
                      .replace(/[^A-Z0-9]/g, "").slice(0, 8)
    const catMap: Record<string, SkuOpcionRaw["categoria"]> = {
      mat: "material", tipo: "tipo", estilo: "estilo", talla: "talla", extra: "extra",
    }
    const data: Omit<SkuOpcionRaw, "documentId"> = {
      categoria: catMap[step!],
      code, label,
      ...(step === "mat"    ? { meta: { kind: extra ?? "silv" } } : {}),
      ...(step === "tipo"   ? { meta: { catJoya: label } } : {}),
      ...(step === "estilo" ? { parentCode: tipo?.code } : {}),
      ...(step === "talla"  ? { parentCode: tipo?.code } : {}),
    }
    // Optimistic: agrega inmediatamente aunque Strapi falle
    const tempId = `local-${Date.now()}`
    const tempEntry: SkuOpcionRaw = { documentId: tempId, ...data }
    setServerOps(prev => [...prev, tempEntry])
    setAddingTo(null)
    setSaveWarn(null)

    const created = await createSkuOpcion(data)
    if (created) {
      // reemplaza el temporal con el real (con documentId real de Strapi)
      setServerOps(prev => prev.map(o => o.documentId === tempId ? created : o))
    } else {
      // Strapi rechazó — la opción queda solo en esta sesión
      setSaveWarn(`"${label}" agregado solo en esta sesión. Activa el permiso "create" en Strapi Admin → Roles → Authenticated → Sku-opcion para persistirlo.`)
    }
  }

  // ── opciones derivadas (server si cargó, fallback a estáticas) ─────────────
  const useSrv = (cat: SkuOpcionRaw["categoria"]) =>
    loaded && serverOps.some(o => o.categoria === cat)

  const materiales = useSrv("material")
    ? serverOps.filter(o => o.categoria === "material").map(toMat)
    : MATERIALES_SKU

  const tipos = useSrv("tipo")
    ? serverOps.filter(o => o.categoria === "tipo").map(toTipo)
    : TIPOS_SKU

  const estilosDisponibles = tipo
    ? (loaded && serverOps.some(o => o.categoria === "estilo" && o.parentCode === tipo.code)
        ? serverOps.filter(o => o.categoria === "estilo" && o.parentCode === tipo.code).map(toEstilo)
        : (ESTILOS_SKU[tipo.code] ?? []))
    : []

  const tallasDisponibles = tipo
    ? (loaded && serverOps.some(o => o.categoria === "talla" && o.parentCode === tipo.code)
        ? serverOps.filter(o => o.categoria === "talla" && o.parentCode === tipo.code).map(o => o.code)
        : (TALLAS_SKU[tipo.code] ?? []))
    : []

  const extrasOpciones = useSrv("extra")
    ? serverOps.filter(o => o.categoria === "extra")
    : EXTRAS_SKU

  const piedrasOpciones = useSrv("piedra")
    ? serverOps.filter(o => o.categoria === "piedra")
    : PIEDRAS_SKU

  // ── lógica del wizard ──────────────────────────────────────────────────────
  const step      = !mat ? "mat" : !tipo ? "tipo" : !estilo ? "estilo" : !talla ? "talla" : "extras"
  const stepIndex = STEPS.indexOf(step)

  function toggleExtra(code: string) {
    setExtras(prev => prev.includes(code) ? prev.filter(e => e !== code) : [...prev, code])
  }

  const extrasConPiedra = [
    ...extras.filter(e => e !== "PIE"),
    ...(extras.includes("PIE") && piedra ? [piedra] : extras.includes("PIE") ? ["PIE"] : []),
  ]

  const skuPreview = mat && tipo && estilo && talla
    ? buildSku(mat.code, tipo.code, estilo.code, talla, extrasConPiedra) : null
  const nombrePreview = mat && tipo && estilo
    ? buildNombre(tipo.label, estilo.label) : null

  function reset() {
    setMat(null); setTipo(null); setEstilo(null); setTalla(""); setExtras([]); setPiedra("")
  }

  async function guardarParcial(opts: { estilo?: typeof estilo | null; talla?: string; extras?: string[] }) {
    if (!mat || !tipo) return
    const e  = opts.estilo === undefined ? estilo : opts.estilo
    const ta = opts.talla !== undefined ? opts.talla : (opts.estilo === null ? "" : talla)
    const ex = opts.extras ?? []
    const parts = [mat.code, tipo.code, e?.code, ta, ...ex].filter(Boolean)
    const sku = parts.join("-")
    const entry: SkuEntry = {
      id: sku, sku,
      mat: mat.code, matLabel: mat.label, matKind: mat.kind,
      tipo: tipo.code, tipoLabel: tipo.label, tipoCategoria: tipo.catJoya,
      estilo: e?.code ?? "", estiloLabel: e?.label ?? "",
      talla: ta, extras: ex,
      nombre: buildNombre(tipo.label, e?.label ?? ""),
    }
    setSaving(true)
    try {
      try { await addSku(entry) } catch {}
      await onAdd(entry)
      reset()
    } finally { setSaving(false) }
  }

  async function guardar() {
    if (!mat || !tipo || !estilo || !talla) return
    const sku = buildSku(mat.code, tipo.code, estilo.code, talla, extrasConPiedra)
    const entry: SkuEntry = {
      id: sku, sku,
      mat: mat.code, matLabel: mat.label, matKind: mat.kind,
      tipo: tipo.code, tipoLabel: tipo.label, tipoCategoria: tipo.catJoya,
      estilo: estilo.code, estiloLabel: estilo.label,
      talla, extras: extrasConPiedra,
      nombre: buildNombre(tipo.label, estilo.label),
    }
    setSaving(true)
    try {
      try { await addSku(entry) } catch {}
      await onAdd(entry)
      reset()
    } finally { setSaving(false) }
  }

  const lbl = "text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2"

  return (
    <div className="flex flex-col gap-0 rounded-xl border border-slate-700/60 bg-slate-900 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80">
        <div>
          <p className="text-sm font-semibold text-slate-100">Constructor de SKU</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Paso a paso: Material → Tipo → Estilo → Talla → Extras
            {loaded && <span className="ml-1.5 text-violet-500/60">· catálogo en línea</span>}
          </p>
          {saveWarn && (
            <p className="text-[10px] text-amber-400/80 mt-1 leading-snug max-w-xs">
              ⚠ {saveWarn}
            </p>
          )}
        </div>
        {onClose && (
          <button type="button" onClick={onClose}
            className="text-slate-600 hover:text-slate-300 transition p-1 rounded">
            <X size={15} />
          </button>
        )}
      </div>

      {/* Progreso */}
      <div className="flex items-center gap-1 px-4 pt-4">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <div className={`flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold transition-all ${
              i < stepIndex ? "bg-violet-500 text-white"
              : i === stepIndex ? "bg-violet-600/20 border-2 border-violet-500 text-violet-400"
              : "bg-slate-800 text-slate-600"
            }`}>
              {i < stepIndex ? <Check size={9} /> : i + 1}
            </div>
            <span className={`text-[9px] font-medium hidden sm:block ${
              i === stepIndex ? "text-violet-400" : i < stepIndex ? "text-violet-500/70" : "text-slate-600"
            }`}>{STEP_LABEL[s]}</span>
            {i < STEPS.length - 1 && <ChevronRight size={9} className="text-slate-700 mx-0.5" />}
          </div>
        ))}
      </div>

      {/* Cuerpo */}
      <div className="px-4 py-4 space-y-4">

        {/* Material */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className={lbl.replace("mb-2","mb-0")}>Material</p>
            <AddBtn onClick={() => setAddingTo("mat")} />
          </div>
          <div className="flex flex-wrap gap-2">
            {materiales.map(m => (
              <Chip key={m.code} label={m.label} active={mat?.code === m.code}
                onClick={() => { setMat(m); if (mat?.code !== m.code) { setTipo(null); setEstilo(null); setTalla(""); setExtras([]) } }} />
            ))}
          </div>
          {addingTo === "mat" && (
            <MiniForm placeholder="ej. Oro 9k"
              extraField={{ label: "Tipo", options: [{ value:"gold", label:"Oro" }, { value:"silv", label:"Plata" }] }}
              onSave={(label, kind) => handleAdd("mat", label, kind)}
              onCancel={() => setAddingTo(null)} />
          )}
        </div>

        {/* Tipo */}
        {mat && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className={lbl.replace("mb-2","mb-0")}>Tipo de pieza</p>
              <div className="flex items-center gap-2">
                {tipo && (
                  <button type="button" disabled={saving}
                    onClick={() => guardarParcial({ estilo: null, talla: "", extras: [] })}
                    className="flex items-center gap-1 h-5 px-2 text-[9px] font-mono text-violet-400
                               bg-violet-500/8 border border-violet-500/20 rounded hover:bg-violet-500/15
                               transition-colors disabled:opacity-40">
                    <Plus size={7} /> {mat.code}-{tipo.code}
                  </button>
                )}
                <AddBtn onClick={() => setAddingTo("tipo")} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {tipos.map(t => (
                <Chip key={t.code} label={t.label} active={tipo?.code === t.code}
                  onClick={() => { setTipo(t); if (tipo?.code !== t.code) { setEstilo(null); setTalla(""); setExtras([]) } }} />
              ))}
            </div>
            {addingTo === "tipo" && (
              <MiniForm placeholder="ej. Tobillera"
                onSave={(label) => handleAdd("tipo", label)}
                onCancel={() => setAddingTo(null)} />
            )}
          </div>
        )}

        {/* Estilo */}
        {tipo && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className={lbl.replace("mb-2","mb-0")}>Estilo</p>
              <div className="flex items-center gap-2">
                {estilo && (
                  <button type="button" disabled={saving}
                    onClick={() => guardarParcial({ talla: "", extras: [] })}
                    className="flex items-center gap-1 h-5 px-2 text-[9px] font-mono text-violet-400
                               bg-violet-500/8 border border-violet-500/20 rounded hover:bg-violet-500/15
                               transition-colors disabled:opacity-40">
                    <Plus size={7} /> {mat!.code}-{tipo.code}-{estilo.code}
                  </button>
                )}
                <AddBtn onClick={() => setAddingTo("estilo")} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {estilosDisponibles.map(e => (
                <Chip key={e.code} label={e.label} active={estilo?.code === e.code}
                  onClick={() => { setEstilo(e); if (estilo?.code !== e.code) { setTalla(""); setExtras([]) } }} />
              ))}
            </div>
            {addingTo === "estilo" && (
              <MiniForm placeholder={`ej. Grumetta fina (para ${tipo.label})`}
                onSave={(label) => handleAdd("estilo", label)}
                onCancel={() => setAddingTo(null)} />
            )}
          </div>
        )}

        {/* Talla */}
        {estilo && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className={lbl.replace("mb-2","mb-0")}>Talla</p>
              <div className="flex items-center gap-2">
                {talla && (
                  <button type="button" disabled={saving}
                    onClick={() => guardarParcial({ extras: [] })}
                    className="flex items-center gap-1 h-5 px-2 text-[9px] font-mono text-violet-400
                               bg-violet-500/8 border border-violet-500/20 rounded hover:bg-violet-500/15
                               transition-colors disabled:opacity-40">
                    <Plus size={7} /> {mat!.code}-{tipo!.code}-{estilo.code}-{talla}
                  </button>
                )}
                <AddBtn onClick={() => setAddingTo("talla")} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {tallasDisponibles.map(t => (
                <Chip key={t} label={t} active={talla === t} onClick={() => setTalla(t)} />
              ))}
            </div>
            {addingTo === "talla" && (
              <MiniForm placeholder="ej. 19cm o T13"
                onSave={(label) => handleAdd("talla", label)}
                onCancel={() => setAddingTo(null)} />
            )}
          </div>
        )}

        {/* Extras */}
        {talla && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className={lbl.replace("mb-2","mb-0")}>Extras (opcionales)</p>
              <AddBtn onClick={() => setAddingTo("extra")} />
            </div>
            <div className="flex flex-wrap gap-2">
              {extrasOpciones.map(ex => (
                <Chip key={ex.code} label={ex.label} active={extras.includes(ex.code)}
                  onClick={() => toggleExtra(ex.code)} />
              ))}
            </div>
            {addingTo === "extra" && (
              <MiniForm placeholder="ej. Con baño de rodio"
                onSave={(label) => handleAdd("extra", label)}
                onCancel={() => setAddingTo(null)} />
            )}
            {extras.includes("PIE") && (
              <div className="mt-2">
                <p className="text-[9px] text-slate-500 mb-1.5">Tipo de piedra</p>
                <div className="flex flex-wrap gap-2">
                  {piedrasOpciones.map(p => (
                    <Chip key={p.code} label={p.label} active={piedra === p.code}
                      onClick={() => setPiedra(prev => prev === p.code ? "" : p.code)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Preview del SKU */}
      {skuPreview && (
        <div className="mx-4 mb-4 px-4 py-3 rounded-lg bg-slate-800/60 border border-violet-500/20">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">SKU generado</p>
              <p className="text-base font-mono font-bold text-violet-400 tracking-widest mt-0.5">{skuPreview}</p>
              <p className="text-xs text-slate-400 mt-0.5">{nombrePreview} · {mat?.label}</p>
            </div>
            <button type="button" onClick={guardar} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500
                         disabled:opacity-50 text-white text-sm font-semibold rounded-lg
                         transition shadow shadow-violet-500/20">
              {saving
                ? <><Loader2 size={13} className="animate-spin" /> Guardando…</>
                : <><Check size={13} /> Agregar al catálogo</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
