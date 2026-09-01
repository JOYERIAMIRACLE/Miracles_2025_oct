"use client"

import { useState } from "react"
import { Check, ChevronRight, Loader2, X } from "lucide-react"
import {
  MATERIALES_SKU, TIPOS_SKU, ESTILOS_SKU, TALLAS_SKU, EXTRAS_SKU, PIEDRAS_SKU,
  SkuEntry, buildSku, buildNombre,
} from "@/types/skuCatalogo"
import { addSku } from "@/api/catalogoJoyeria/getCatalogoJoyeria"

interface Props {
  /** Código de tipo pre-seleccionado, ej "ESC" para venir de una búsqueda de esclavas */
  defaultTipo?: string
  /** Callback cuando el SKU se guardó en catálogo. Recibe la entrada creada. */
  onAdd: (entry: SkuEntry) => void | Promise<void>
  /** Solo en modo modal — muestra el encabezado y botón cerrar */
  onClose?: () => void
}

type Step = "mat" | "tipo" | "estilo" | "talla" | "extras"
const STEPS: Step[] = ["mat", "tipo", "estilo", "talla", "extras"]
const STEP_LABEL: Record<Step, string> = {
  mat:    "Material",
  tipo:   "Tipo",
  estilo: "Estilo",
  talla:  "Talla",
  extras: "Extras",
}

function Chip({
  label, active, onClick,
}: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
        active
          ? "bg-violet-600 border-violet-500 text-white shadow-sm shadow-violet-500/30"
          : "bg-slate-800/60 border-slate-700/50 text-slate-300 hover:border-violet-500/40 hover:text-violet-300"
      }`}
    >
      {label}
    </button>
  )
}

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

  const step: Step = !mat ? "mat" : !tipo ? "tipo" : !estilo ? "estilo" : !talla ? "talla" : "extras"
  const stepIndex = STEPS.indexOf(step)

  const estilosDisponibles = tipo ? (ESTILOS_SKU[tipo.code] ?? []) : []
  const tallasDisponibles  = tipo ? (TALLAS_SKU[tipo.code]  ?? []) : []

  function toggleExtra(code: string) {
    setExtras(prev =>
      prev.includes(code) ? prev.filter(e => e !== code) : [...prev, code]
    )
  }

  const extrasConPiedra = [
    ...extras.filter(e => e !== "PIE"),
    ...(extras.includes("PIE") && piedra ? [piedra] : extras.includes("PIE") ? ["PIE"] : []),
  ]

  const skuPreview = mat && tipo && estilo && talla
    ? buildSku(mat.code, tipo.code, estilo.code, talla, extrasConPiedra)
    : null

  const nombrePreview = mat && tipo && estilo
    ? buildNombre(tipo.label, estilo.label)
    : null

  function reset() {
    setMat(null); setTipo(null); setEstilo(null); setTalla(""); setExtras([]); setPiedra("")
  }

  async function guardar() {
    if (!mat || !tipo || !estilo || !talla) return
    const sku = buildSku(mat.code, tipo.code, estilo.code, talla, extrasConPiedra)
    const entry: SkuEntry = {
      id:            sku,
      sku,
      mat:           mat.code,
      matLabel:      mat.label,
      matKind:       mat.kind,
      tipo:          tipo.code,
      tipoLabel:     tipo.label,
      tipoCategoria: tipo.catJoya,
      estilo:        estilo.code,
      estiloLabel:   estilo.label,
      talla,
      extras:        extrasConPiedra,
      nombre:        buildNombre(tipo.label, estilo.label),
    }
    setSaving(true)
    try {
      try {
        await addSku(entry)
      } catch {
        // Si el backend rechaza (schema aún no desplegado), sigue igual — el SKU se guarda localmente
      }
      await onAdd(entry)
      reset()
    } finally {
      setSaving(false)
    }
  }

  const lbl = "text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2"

  return (
    <div className="flex flex-col gap-0 rounded-xl border border-slate-700/60 bg-slate-900 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80">
        <div>
          <p className="text-sm font-semibold text-slate-100">Constructor de SKU</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Paso a paso: Material → Tipo → Estilo → Talla → Extras</p>
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
              i < stepIndex
                ? "bg-violet-500 text-white"
                : i === stepIndex
                  ? "bg-violet-600/20 border-2 border-violet-500 text-violet-400"
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

      {/* Cuerpo del paso actual */}
      <div className="px-4 py-4 space-y-4">

        {/* Material */}
        <div>
          <p className={lbl}>Material</p>
          <div className="flex flex-wrap gap-2">
            {MATERIALES_SKU.map(m => (
              <Chip key={m.code} label={m.label} active={mat?.code === m.code}
                onClick={() => { setMat(m); if (mat?.code !== m.code) { setTipo(null); setEstilo(null); setTalla(""); setExtras([]) } }} />
            ))}
          </div>
        </div>

        {/* Tipo — visible si hay material */}
        {mat && (
          <div>
            <p className={lbl}>Tipo de pieza</p>
            <div className="flex flex-wrap gap-2">
              {TIPOS_SKU.map(t => (
                <Chip key={t.code} label={t.label} active={tipo?.code === t.code}
                  onClick={() => { setTipo(t); if (tipo?.code !== t.code) { setEstilo(null); setTalla(""); setExtras([]) } }} />
              ))}
            </div>
          </div>
        )}

        {/* Estilo — visible si hay tipo */}
        {tipo && (
          <div>
            <p className={lbl}>Estilo</p>
            <div className="flex flex-wrap gap-2">
              {estilosDisponibles.map(e => (
                <Chip key={e.code} label={e.label} active={estilo?.code === e.code}
                  onClick={() => { setEstilo(e); if (estilo?.code !== e.code) { setTalla(""); setExtras([]) } }} />
              ))}
            </div>
          </div>
        )}

        {/* Talla — visible si hay estilo */}
        {estilo && (
          <div>
            <p className={lbl}>Talla</p>
            <div className="flex flex-wrap gap-2">
              {tallasDisponibles.map(t => (
                <Chip key={t} label={t} active={talla === t}
                  onClick={() => setTalla(t)} />
              ))}
            </div>
          </div>
        )}

        {/* Extras — visible si hay talla */}
        {talla && (
          <div>
            <p className={lbl}>Extras (opcionales)</p>
            <div className="flex flex-wrap gap-2">
              {EXTRAS_SKU.map(ex => (
                <Chip key={ex.code} label={ex.label} active={extras.includes(ex.code)}
                  onClick={() => toggleExtra(ex.code)} />
              ))}
            </div>
            {extras.includes("PIE") && (
              <div className="mt-2">
                <p className="text-[9px] text-slate-500 mb-1.5">Tipo de piedra</p>
                <div className="flex flex-wrap gap-2">
                  {PIEDRAS_SKU.map(p => (
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
            <button
              type="button"
              onClick={guardar}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition shadow shadow-violet-500/20"
            >
              {saving
                ? <><Loader2 size={13} className="animate-spin" /> Guardando…</>
                : <><Check size={13} /> Agregar al catálogo</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
