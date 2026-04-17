"use client"

import { useState, useEffect, useMemo } from "react"
import { Plus, Edit, Trash2, X, Loader2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { useGetPartidas } from "@/api/partida-presupuesto/getPartidas"
import { createPartida } from "@/api/partida-presupuesto/createPartida"
import { updatePartida } from "@/api/partida-presupuesto/updatePartida"
import { deletePartida } from "@/api/partida-presupuesto/deletePartida"
import { useGetTransacciones } from "@/api/transaccion/getTransacciones"
import { useGetEventos }      from "@/api/evento-calendario/getEventos"
import {
  PartidaPresupuestoType,
  PartidaPresupuestoPayload,
  CategoriaPresupuesto,
} from "@/types/partida-presupuesto"

// ─── Constantes ────────────────────────────────────────────────────────────────
const CATEGORIAS: CategoriaPresupuesto[] = [
  "vivienda", "alimentación", "transporte", "servicios",
  "gastos_personales", "entretenimiento", "salud", "ropa",
  "educación", "ahorro", "inversión", "ingreso",
]

// Etiquetas de display para cada categoría
const CAT_LABEL: Record<string, string> = {
  "vivienda":         "1. Vivienda",
  "alimentación":     "2. Alimentación",
  "transporte":       "3. Transporte",
  "servicios":        "4. Servicios",
  "gastos_personales":"5. Gastos Personales",
  "entretenimiento":  "6. Entretenimiento",
  "salud":            "7. Salud",
  "ropa":             "8. Ropa",
  "educación":        "9. Educación",
  "ahorro":           "10. Ahorro",
  "inversión":        "11. Inversión",
  "ingreso":          "12. Ingreso",
}

const EMPTY_FORM: PartidaPresupuestoPayload = {
  descripcion: "", categoria: null, tipo: null,
  tipoPago: null, frecuencia: "mensual", monto: 0, activo: true,
}

// Limpia el payload igual que en los helpers de API (por si se llama directamente)
const cleanPayload = (form: PartidaPresupuestoPayload) =>
  Object.fromEntries(
    Object.entries(form).filter(([, v]) => v !== null && v !== undefined && v !== "")
  ) as PartidaPresupuestoPayload

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Convierte el monto base a cada frecuencia
function calcFrecuencias(monto: number, frecuencia: string | null) {
  switch (frecuencia) {
    case "diario":    return { dia: monto,      semana: monto * 7,    quincena: monto * 15,  mensual: monto * 30,   anual: monto * 365  }
    case "semanal":   return { dia: monto / 7,  semana: monto,        quincena: monto * 2,   mensual: monto * 4.33, anual: monto * 52   }
    case "quincenal": return { dia: monto / 15, semana: monto / 2,    quincena: monto,       mensual: monto * 2,    anual: monto * 24   }
    case "mensual":   return { dia: monto / 30, semana: monto / 4.33, quincena: monto / 2,   mensual: monto,        anual: monto * 12   }
    case "anual":     return { dia: monto / 365,semana: monto / 52,   quincena: monto / 24,  mensual: monto / 12,   anual: monto        }
    default:          return { dia: 0, semana: 0, quincena: 0, mensual: 0, anual: 0 }
  }
}

const fmt = (n: number) => {
  if (Math.abs(n) < 0.5) return "$0"
  return `$${Math.round(n).toLocaleString("es-MX")}`
}

const fmtSigned = (n: number, esIngreso: boolean) => {
  const abs = Math.abs(n)
  if (abs < 0.5) return <span className="text-zinc-300 dark:text-zinc-600">$0</span>
  const s = `$${Math.round(abs).toLocaleString("es-MX")}`
  return esIngreso
    ? <span className="text-emerald-600 dark:text-emerald-400 font-medium">+{s}</span>
    : <span className="text-red-500 dark:text-red-400">-{s}</span>
}

const esIngreso = (p: PartidaPresupuestoType) => p.categoria === "ingreso" || p.tipo === "ingreso"

const TIPO_PAGO_COLORS: Record<string, string> = {
  efectivo:      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  TDC:           "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  apartado:      "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  transferencia: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  bonos:         "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
  debito:        "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
}

const inputCls = "w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-zinc-400"
const selectCls = `${inputCls} cursor-pointer`

// ─── Mapeo categorías presupuesto → transaccion ──────────────────────────────
// Las categorías del presupuesto tienen acentos, las de transacción no
const PRESUPUESTO_A_TRANSACCION: Record<string, string[]> = {
  "vivienda":          ["vivienda"],
  "alimentación":      ["alimentacion"],
  "transporte":        ["transporte"],
  "servicios":         ["servicios"],
  "gastos_personales": ["otro"],
  "entretenimiento":   ["entretenimiento"],
  "salud":             ["salud"],
  "ropa":              ["ropa"],
  "educación":         ["educacion"],
  "ahorro":            ["ahorro"],
  "inversión":         ["inversion"],
  "ingreso":           ["sueldo", "freelance", "venta"],
}

const BAR_COLORS: Record<string, { bar: string; bg: string }> = {
  "vivienda":          { bar: "bg-blue-500",    bg: "bg-blue-500/10"    },
  "alimentación":      { bar: "bg-amber-500",   bg: "bg-amber-500/10"   },
  "transporte":        { bar: "bg-violet-500",  bg: "bg-violet-500/10"  },
  "servicios":         { bar: "bg-cyan-500",     bg: "bg-cyan-500/10"    },
  "gastos_personales": { bar: "bg-pink-500",    bg: "bg-pink-500/10"    },
  "entretenimiento":   { bar: "bg-orange-500",  bg: "bg-orange-500/10"  },
  "salud":             { bar: "bg-red-500",     bg: "bg-red-500/10"     },
  "ropa":              { bar: "bg-fuchsia-500", bg: "bg-fuchsia-500/10" },
  "educación":         { bar: "bg-teal-500",    bg: "bg-teal-500/10"    },
  "ahorro":            { bar: "bg-emerald-500", bg: "bg-emerald-500/10" },
  "inversión":         { bar: "bg-indigo-500",  bg: "bg-indigo-500/10"  },
  "ingreso":           { bar: "bg-green-500",   bg: "bg-green-500/10"   },
}

// ─── Página ────────────────────────────────────────────────────────────────────
export default function PresupuestoPage() {
  // HOOKS
  const { partidas: dataStrapi, loading, error } = useGetPartidas()
  const { transacciones } = useGetTransacciones()
  const { eventos }       = useGetEventos()
  const [partidas,       setPartidas]       = useState<PartidaPresupuestoType[]>([])
  const [modalOpen,      setModalOpen]      = useState(false)
  const [editingPartida, setEditingPartida] = useState<PartidaPresupuestoType | null>(null)
  const [form,           setForm]           = useState<PartidaPresupuestoPayload>(EMPTY_FORM)
  const [saving,         setSaving]         = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Selector de mes para presupuesto vs real
  const hoy = new Date()
  const mesDefault = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`
  const [mesSeleccionado, setMesSeleccionado] = useState(mesDefault)

  useEffect(() => { setPartidas(dataStrapi ?? []) }, [dataStrapi])

  // ─── Agrupación por categoría ──────────────────────────────────────────────
  const porCategoria = CATEGORIAS.map(cat => ({
    cat,
    items: partidas.filter(p => p.activo !== false && p.categoria === cat),
  })).filter(g => g.items.length > 0)

  // ─── Totales globales ──────────────────────────────────────────────────────
  const totales = partidas.filter(p => p.activo !== false).reduce(
    (acc, p) => {
      const f = calcFrecuencias(p.monto ?? 0, p.frecuencia)
      const sign = esIngreso(p) ? 1 : -1
      return {
        dia:      acc.dia      + sign * f.dia,
        semana:   acc.semana   + sign * f.semana,
        quincena: acc.quincena + sign * f.quincena,
        mensual:  acc.mensual  + sign * f.mensual,
        anual:    acc.anual    + sign * f.anual,
      }
    },
    { dia: 0, semana: 0, quincena: 0, mensual: 0, anual: 0 }
  )

  // ─── Presupuesto vs Real ────────────────────────────────────────────────
  const mesLabelObj = new Date(mesSeleccionado + "-15")
  const mesLabel = mesLabelObj.toLocaleString("es-MX", { month: "long", year: "numeric" })
  const esMesActual = mesSeleccionado === mesDefault

  const comparativa = useMemo(() => {
    const txMes = transacciones.filter(tx => tx.fecha.slice(0, 7) === mesSeleccionado)
    const evMes = eventos.filter(ev => ev.fecha.slice(0, 7) === mesSeleccionado)

    // IDs de transacciones para no contar doble (evento + transacción del mismo registro)
    const txDescripciones = new Set(txMes.map(tx => `${tx.fecha.slice(0, 10)}_${tx.monto}`))

    return CATEGORIAS.filter(cat => cat !== "ingreso").map(cat => {
      // Presupuestado mensual
      const partidasCat = partidas.filter(p => p.activo !== false && p.categoria === cat)
      const presupuestado = partidasCat.reduce((s, p) => {
        const f = calcFrecuencias(p.monto ?? 0, p.frecuencia)
        return s + f.mensual
      }, 0)

      // Gastado real del mes desde transacciones (gastos + transferencias para ahorro/inversión)
      const catsTx = PRESUPUESTO_A_TRANSACCION[cat] ?? []
      const gastadoTx = txMes
        .filter(tx => (tx.tipo === "gasto" || tx.tipo === "transferencia") && catsTx.includes(tx.categoria ?? ""))
        .reduce((s, tx) => s + Number(tx.monto), 0)

      // Gastado desde eventos del calendario (categoría con acentos = misma que presupuesto)
      // Solo contar eventos que NO tienen transacción asociada (evitar doble conteo)
      const gastadoEv = evMes
        .filter(ev => ev.tipo === "pago" && ev.categoria === cat)
        .filter(ev => !txDescripciones.has(`${ev.fecha.slice(0, 10)}_${ev.monto}`))
        .reduce((s, ev) => s + Number(ev.monto), 0)

      const gastado = gastadoTx + gastadoEv
      const pct = presupuestado > 0 ? (gastado / presupuestado) * 100 : 0
      const excedido = pct > 100

      return { cat, presupuestado, gastado, pct, excedido }
    }).filter(c => c.presupuestado > 0 || c.gastado > 0)
  }, [partidas, transacciones, eventos, mesSeleccionado])

  // Totales de ingreso presupuestado vs real
  const comparativaIngreso = useMemo(() => {
    const txMes = transacciones.filter(tx => tx.fecha.slice(0, 7) === mesSeleccionado)
    const evMes = eventos.filter(ev => ev.fecha.slice(0, 7) === mesSeleccionado)
    const txKeys = new Set(txMes.map(tx => `${tx.fecha.slice(0, 10)}_${tx.monto}`))

    const partidasIngreso = partidas.filter(p => p.activo !== false && (p.categoria === "ingreso" || p.tipo === "ingreso"))
    const presupuestado = partidasIngreso.reduce((s, p) => s + calcFrecuencias(p.monto ?? 0, p.frecuencia).mensual, 0)
    const realTx = txMes.filter(tx => tx.tipo === "ingreso").reduce((s, tx) => s + Number(tx.monto), 0)
    const realEv = evMes
      .filter(ev => ev.tipo === "ingreso")
      .filter(ev => !txKeys.has(`${ev.fecha.slice(0, 10)}_${ev.monto}`))
      .reduce((s, ev) => s + Number(ev.monto), 0)
    const real = realTx + realEv
    return { presupuestado, real, pct: presupuestado > 0 ? (real / presupuestado) * 100 : 0 }
  }, [partidas, transacciones, eventos, mesSeleccionado])

  const totalPresupuestadoGasto = comparativa.reduce((s, c) => s + c.presupuestado, 0)
  const totalGastadoReal = comparativa.reduce((s, c) => s + c.gastado, 0)
  const pctGastoTotal = totalPresupuestadoGasto > 0 ? (totalGastadoReal / totalPresupuestadoGasto) * 100 : 0

  // ─── CRUD ─────────────────────────────────────────────────────────────────
  const handleNuevo = () => { setEditingPartida(null); setForm(EMPTY_FORM); setModalOpen(true) }
  const handleEdit  = (p: PartidaPresupuestoType) => {
    setEditingPartida(p)
    setForm({ descripcion: p.descripcion, categoria: p.categoria, tipo: p.tipo, tipoPago: p.tipoPago, frecuencia: p.frecuencia, monto: p.monto, activo: p.activo })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.descripcion.trim()) { toast.error("La descripción es obligatoria"); return }
    if (!form.monto) { toast.error("El monto es obligatorio"); return }
    setSaving(true)
    try {
      if (editingPartida) {
        const updated = await updatePartida(editingPartida.documentId, form)
        setPartidas(prev => prev.map(p => p.documentId === updated.documentId ? updated : p))
        toast.success("Partida actualizada")
      } else {
        const nueva = await createPartida(form)
        setPartidas(prev => [...prev, nueva])
        toast.success("Partida creada")
      }
      setModalOpen(false)
    } catch (err: any) {
      toast.error(err.message ?? "Ocurrió un error")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (documentId: string) => {
    try {
      await deletePartida(documentId)
      setPartidas(prev => prev.filter(p => p.documentId !== documentId))
      toast.success("Partida eliminada")
    } catch (err: any) {
      toast.error(err.message ?? "No se pudo eliminar")
    } finally {
      setConfirmDeleteId(null)
    }
  }

  if (error) return <div className="text-sm text-red-500 p-8">Error: {error}</div>

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Presupuesto</h1>
          <p className="text-sm text-zinc-500">Planifica tus ingresos y egresos por categoría.</p>
        </div>
        <Button onClick={handleNuevo} className="h-9 gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-full">
          <Plus className="h-4 w-4" /> Nueva Partida
        </Button>
      </div>

      {/* ── Presupuesto vs Real ──────────────────────────────────────────── */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-700/40 p-5 backdrop-blur-sm space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Presupuesto vs Real</h2>
              <p className="text-[10px] text-slate-500 mt-0.5 capitalize">{mesLabel}</p>
            </div>
            {/* Selector de mes */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const d = new Date(mesSeleccionado + "-15")
                  d.setMonth(d.getMonth() - 1)
                  setMesSeleccionado(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
                }}
                className="h-7 w-7 rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center text-xs transition-colors"
              >
                ←
              </button>
              <input
                type="month"
                title="Seleccionar mes"
                value={mesSeleccionado}
                onChange={e => setMesSeleccionado(e.target.value)}
                className="h-7 text-xs bg-slate-800 border border-slate-700 rounded-md px-2 text-slate-300"
              />
              <button
                type="button"
                onClick={() => {
                  const d = new Date(mesSeleccionado + "-15")
                  d.setMonth(d.getMonth() + 1)
                  setMesSeleccionado(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
                }}
                className="h-7 w-7 rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center text-xs transition-colors"
              >
                →
              </button>
              {!esMesActual && (
                <button
                  type="button"
                  onClick={() => setMesSeleccionado(mesDefault)}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 ml-1"
                >
                  Hoy
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="text-slate-500">Presupuestado: <span className="text-slate-300 font-semibold">{fmt(totalPresupuestadoGasto)}</span></span>
            <span className="text-slate-500">Gastado: <span className={`font-semibold ${pctGastoTotal > 100 ? "text-red-400" : "text-emerald-400"}`}>{fmt(totalGastadoReal)}</span></span>
            <span className={`px-2 py-0.5 rounded-full font-semibold ${pctGastoTotal > 100 ? "bg-red-500/10 text-red-400" : pctGastoTotal > 80 ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"}`}>
              {Math.round(pctGastoTotal)}%
            </span>
          </div>
        </div>

        {/* Resumen cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Ingresos */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[10px] text-slate-500 uppercase font-medium">Ingresos</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-lg font-bold text-emerald-400">{fmt(comparativaIngreso.real)}</p>
                <p className="text-[10px] text-slate-600">de {fmt(comparativaIngreso.presupuestado)}</p>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${comparativaIngreso.pct >= 100 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                {Math.round(comparativaIngreso.pct)}%
              </span>
            </div>
          </motion.div>

          {/* Gastos */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-3.5 w-3.5 text-red-400" />
              <span className="text-[10px] text-slate-500 uppercase font-medium">Gastos</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-lg font-bold text-red-400">{fmt(totalGastadoReal)}</p>
                <p className="text-[10px] text-slate-600">de {fmt(totalPresupuestadoGasto)}</p>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${pctGastoTotal > 100 ? "bg-red-500/10 text-red-400" : pctGastoTotal > 80 ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                {Math.round(pctGastoTotal)}%
              </span>
            </div>
          </motion.div>

          {/* Saldo */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/30">
            <div className="flex items-center gap-2 mb-2">
              {totalPresupuestadoGasto - totalGastadoReal >= 0
                ? <CheckCircle className="h-3.5 w-3.5 text-cyan-400" />
                : <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              }
              <span className="text-[10px] text-slate-500 uppercase font-medium">Disponible</span>
            </div>
            <div>
              <p className={`text-lg font-bold ${totalPresupuestadoGasto - totalGastadoReal >= 0 ? "text-cyan-400" : "text-red-400"}`}>
                {fmt(totalPresupuestadoGasto - totalGastadoReal)}
              </p>
              <p className="text-[10px] text-slate-600">restante del presupuesto</p>
            </div>
          </motion.div>
        </div>

        {/* Barras por categoría */}
        <div className="space-y-3">
          {comparativa.map((c, i) => {
            const colors = BAR_COLORS[c.cat] ?? { bar: "bg-slate-500", bg: "bg-slate-500/10" }
            const pctClamped = Math.min(c.pct, 100)
            const pctExceso = c.pct > 100 ? Math.min(c.pct - 100, 100) : 0

            return (
              <motion.div key={c.cat} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-300 capitalize">{CAT_LABEL[c.cat]?.replace(/^\d+\.\s*/, "") ?? c.cat}</span>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-slate-600">{fmt(c.gastado)} / {fmt(c.presupuestado)}</span>
                    <span className={`font-semibold ${c.excedido ? "text-red-400" : c.pct > 80 ? "text-amber-400" : "text-emerald-400"}`}>
                      {Math.round(c.pct)}%
                    </span>
                  </div>
                </div>
                <div className="h-3 rounded-full bg-slate-800/80 overflow-hidden border border-slate-700/30 relative">
                  {/* Barra de gasto dentro del presupuesto */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pctClamped}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.05 * i }}
                    className={`h-full rounded-full ${colors.bar} ${c.excedido ? "rounded-r-none" : ""}`}
                  />
                  {/* Barra de exceso (roja) */}
                  {pctExceso > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pctExceso}%` }}
                      transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 + 0.05 * i }}
                      className="h-full rounded-r-full bg-red-500 absolute top-0"
                      style={{ left: `${pctClamped}%` }}
                    />
                  )}
                </div>
              </motion.div>
            )
          })}

          {comparativa.length === 0 && (
            <p className="text-xs text-slate-600 text-center py-4">
              Registra transacciones para ver la comparativa con tu presupuesto
            </p>
          )}
        </div>
      </div>

      {/* Tabla */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-sm overflow-hidden rounded-xl">
        <div className="w-full overflow-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 sticky top-0 z-10">
              <tr>
                <th className="h-10 px-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tipo Pago</th>
                <th className="h-10 px-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tipo</th>
                <th className="h-10 px-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Frecuencia</th>
                <th className="h-10 px-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Descripción</th>
                <th className="h-10 px-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Día</th>
                <th className="h-10 px-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Semana</th>
                <th className="h-10 px-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Quincena</th>
                <th className="h-10 px-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Mensual</th>
                <th className="h-10 px-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Anual</th>
                <th className="h-10 px-4" scope="col"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-zinc-50 dark:border-zinc-800/40">
                  {Array.from({ length: 10 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3.5 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" /></td>
                  ))}
                </tr>
              ))}

              {!loading && porCategoria.map(({ cat, items }) => {
                // Subtotal del grupo
                const subTotal = items.reduce(
                  (acc, p) => {
                    const f = calcFrecuencias(p.monto ?? 0, p.frecuencia)
                    const sign = esIngreso(p) ? 1 : -1
                    return { dia: acc.dia + sign * f.dia, semana: acc.semana + sign * f.semana, quincena: acc.quincena + sign * f.quincena, mensual: acc.mensual + sign * f.mensual, anual: acc.anual + sign * f.anual }
                  },
                  { dia: 0, semana: 0, quincena: 0, mensual: 0, anual: 0 }
                )
                const esGrupoIngreso = cat === "31.Ingreso"

                return [
                  /* Fila de categoría */
                  <tr key={`cat-${cat}`} className="bg-zinc-50 dark:bg-zinc-800/50 border-t-2 border-zinc-200 dark:border-zinc-700">
                    <td colSpan={4} className="px-4 py-2">
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">{CAT_LABEL[cat] ?? cat}</span>
                    </td>
                    <td className="px-4 py-2 text-right text-xs font-semibold">{fmtSigned(subTotal.dia,      esGrupoIngreso)}</td>
                    <td className="px-4 py-2 text-right text-xs font-semibold">{fmtSigned(subTotal.semana,   esGrupoIngreso)}</td>
                    <td className="px-4 py-2 text-right text-xs font-semibold">{fmtSigned(subTotal.quincena, esGrupoIngreso)}</td>
                    <td className="px-4 py-2 text-right text-xs font-semibold">{fmtSigned(subTotal.mensual,  esGrupoIngreso)}</td>
                    <td className="px-4 py-2 text-right text-xs font-semibold">{fmtSigned(subTotal.anual,    esGrupoIngreso)}</td>
                    <td />
                  </tr>,

                  /* Filas de partidas */
                  ...items.map(p => {
                    const f  = calcFrecuencias(p.monto ?? 0, p.frecuencia)
                    const ing = esIngreso(p)
                    return (
                      <tr key={p.documentId} className="border-b border-zinc-50 dark:border-zinc-800/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 group transition-colors">
                        <td className="px-4 py-2.5">
                          {p.tipoPago ? (
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TIPO_PAGO_COLORS[p.tipoPago] ?? ""}`}>
                              {p.tipoPago}
                            </span>
                          ) : <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-zinc-500">{p.tipo ?? "—"}</td>
                        <td className="px-4 py-2.5 text-xs text-zinc-500">{p.frecuencia ?? "—"}</td>
                        <td className="px-4 py-2.5 font-medium text-zinc-800 dark:text-zinc-200">{p.descripcion}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{fmtSigned(f.dia,      ing)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{fmtSigned(f.semana,   ing)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{fmtSigned(f.quincena, ing)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{fmtSigned(f.mensual,  ing)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{fmtSigned(f.anual,    ing)}</td>
                        <td className="px-4 py-2.5">
                          {confirmDeleteId === p.documentId ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-zinc-400">¿Eliminar?</span>
                              <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs text-red-600 hover:bg-red-50" onClick={() => handleDelete(p.documentId)}>Sí</Button>
                              <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs" onClick={() => setConfirmDeleteId(null)}>No</Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-indigo-600" onClick={() => handleEdit(p)}><Edit className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-red-600" onClick={() => setConfirmDeleteId(p.documentId)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  }),
                ]
              })}

              {/* Fila de totales */}
              {!loading && partidas.length > 0 && (
                <tr className="border-t-2 border-zinc-300 dark:border-zinc-600 bg-zinc-900 dark:bg-zinc-950">
                  <td colSpan={4} className="px-4 py-3">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Flujo neto</span>
                  </td>
                  {([totales.dia, totales.semana, totales.quincena, totales.mensual, totales.anual] as number[]).map((val, i) => (
                    <td key={i} className="px-4 py-3 text-right">
                      <span className={`text-sm font-bold ${val >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {val >= 0 ? "+" : ""}{fmt(val)}
                      </span>
                    </td>
                  ))}
                  <td />
                </tr>
              )}
            </tbody>
          </table>

          {!loading && partidas.length === 0 && (
            <div className="py-16 text-center text-zinc-400 text-sm">
              Aún no hay partidas. Agrega tu primera partida de presupuesto.
            </div>
          )}
        </div>
      </Card>

      {/* Modal Crear / Editar */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}
        >
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {editingPartida ? "Editar Partida" : "Nueva Partida"}
              </h2>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400" onClick={() => setModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Descripción */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Descripción <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Ej. Hipoteca, Sueldo, Netflix..." value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} className={inputCls} />
              </div>

              {/* Categoría */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Categoría</label>
                <select title="Categoría" value={form.categoria ?? ""} onChange={e => setForm(f => ({ ...f, categoria: (e.target.value || null) as any }))} className={selectCls}>
                  <option value="">— Sin categoría —</option>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{CAT_LABEL[c] ?? c}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Tipo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Tipo</label>
                  <select title="Tipo" value={form.tipo ?? ""} onChange={e => setForm(f => ({ ...f, tipo: (e.target.value || null) as any }))} className={selectCls}>
                    <option value="">— Sin tipo —</option>
                    <option value="necesidad">Necesidad</option>
                    <option value="gastos prescindibles">Gastos Prescindibles</option>
                    <option value="ahorro">Ahorro</option>
                    <option value="ingreso">Ingreso</option>
                  </select>
                </div>

                {/* Tipo de pago */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Tipo de Pago</label>
                  <select title="Tipo de pago" value={form.tipoPago ?? ""} onChange={e => setForm(f => ({ ...f, tipoPago: (e.target.value || null) as any }))} className={selectCls}>
                    <option value="">— Sin tipo —</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="TDC">TDC</option>
                    <option value="apartado">Apartado</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="bonos">Bonos</option>
                    <option value="debito">Débito</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Frecuencia */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Frecuencia <span className="text-red-500">*</span></label>
                  <select title="Frecuencia" value={form.frecuencia ?? "mensual"} onChange={e => setForm(f => ({ ...f, frecuencia: e.target.value as any }))} className={selectCls}>
                    <option value="diario">Diario</option>
                    <option value="semanal">Semanal</option>
                    <option value="quincenal">Quincenal</option>
                    <option value="mensual">Mensual</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>

                {/* Monto */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Monto ($) <span className="text-red-500">*</span></label>
                  <input type="number" placeholder="0" min="0" value={form.monto || ""}
                    onChange={e => setForm(f => ({ ...f, monto: e.target.value ? Number(e.target.value) : 0 }))} className={inputCls} />
                </div>
              </div>

              {/* Preview de frecuencias */}
              {form.monto > 0 && (
                <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 p-3 grid grid-cols-5 gap-1 text-center">
                  {(["Día", "Semana", "Quincena", "Mensual", "Anual"] as const).map((label, i) => {
                    const f = calcFrecuencias(form.monto, form.frecuencia)
                    const vals = [f.dia, f.semana, f.quincena, f.mensual, f.anual]
                    const esIng = form.tipo === "ingreso" || form.categoria === "ingreso"
                    return (
                      <div key={label}>
                        <p className="text-xs text-zinc-400">{label}</p>
                        <p className={`text-xs font-semibold ${esIng ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                          {esIng ? "+" : "-"}{fmt(vals[i]).replace("$", "")}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Activo */}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="activo" checked={form.activo ?? true}
                  onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
                <label htmlFor="activo" className="text-sm text-zinc-700 dark:text-zinc-300">Partida activa</label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800">
              <Button variant="ghost" className="text-zinc-600" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
              <Button className="bg-indigo-600 text-white hover:bg-indigo-700 gap-2" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingPartida ? "Guardar cambios" : "Crear Partida"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
