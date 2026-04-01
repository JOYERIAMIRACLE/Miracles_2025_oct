"use client"

import { useState, useEffect } from "react"
import { Edit, ChevronLeft, ChevronRight, Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"

import { useGetRegistros }  from "@/api/registro-mensual/getRegistros"
import { createRegistro }   from "@/api/registro-mensual/createRegistro"
import { updateRegistro }   from "@/api/registro-mensual/updateRegistro"
import { useGetPartidas }   from "@/api/partida-presupuesto/getPartidas"

import { RegistroMensualType } from "@/types/registro-mensual"
import { CategoriaPresupuesto } from "@/types/partida-presupuesto"

// ─── Constantes ────────────────────────────────────────────────────────────────
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

const CATEGORIAS_EGRESO: CategoriaPresupuesto[] = [
  "vivienda","alimentación","transporte","servicios","gastos Personales",
  "entretenimiento","salud","ropa","educación","ahorro","inversión",
]
const CATEGORIA_INGRESO: CategoriaPresupuesto = "ingreso"

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  `$${Math.round(n).toLocaleString("es-MX")}`

const fmtDec = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function calcMensual(monto: number, frecuencia: string | null) {
  switch (frecuencia) {
    case "diario":    return monto * 30
    case "semanal":   return monto * 4.33
    case "quincenal": return monto * 2
    case "mensual":   return monto
    case "anual":     return monto / 12
    default:          return 0
  }
}

// ─── Fila de categoría ────────────────────────────────────────────────────────
function FilaCategoria({
  categoria, presupuestado, registro, mes, anio, esIngreso,
  onSaved,
}: {
  categoria: string
  presupuestado: number
  registro: RegistroMensualType | undefined
  mes: number
  anio: number
  esIngreso: boolean
  onSaved: (r: RegistroMensualType) => void
}) {
  const [editando, setEditando] = useState(false)
  const [valor,    setValor]    = useState<string>("")
  const [saving,   setSaving]   = useState(false)

  const real       = registro?.monto ?? null
  const diferencia = real !== null ? (esIngreso ? real - presupuestado : presupuestado - real) : null
  const tieneReal  = real !== null

  const handleEditar = () => {
    setValor(String(real ?? presupuestado))
    setEditando(true)
  }

  const handleGuardar = async () => {
    const monto = parseFloat(valor)
    if (isNaN(monto) || monto < 0) { toast.error("Monto inválido"); return }
    setSaving(true)
    try {
      const payload = {
        descripcion: `${categoria} — ${MESES[mes - 1]} ${anio}`,
        tipo: esIngreso ? "ingreso_variable" as const : "gasto_extra" as const,
        monto,
        mes,
        anio,
        categoria: categoria as CategoriaPresupuesto,
        notas: null,
      }
      let saved: RegistroMensualType
      if (registro) {
        saved = await updateRegistro(registro.documentId, payload)
      } else {
        saved = await createRegistro(payload)
      }
      onSaved(saved)
      setEditando(false)
      toast.success("Guardado")
    } catch (err: any) {
      toast.error(err.message ?? "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  const handleCancelar = () => setEditando(false)

  return (
    <tr className="border-b border-zinc-50 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 group transition-colors">
      {/* Categoría */}
      <td className="px-4 py-3 text-sm font-medium text-zinc-800 dark:text-zinc-200 capitalize">
        {categoria}
      </td>

      {/* Presupuestado */}
      <td className="px-4 py-3 text-right text-sm text-zinc-500 tabular-nums">
        {presupuestado > 0 ? fmt(presupuestado) : <span className="text-zinc-300 dark:text-zinc-600">—</span>}
      </td>

      {/* Real — editable inline */}
      <td className="px-4 py-3 text-right">
        {editando ? (
          <div className="flex items-center justify-end gap-1">
            <span className="text-zinc-400 text-sm">$</span>
            <input
              type="number"
              autoFocus
              title={`Monto real de ${categoria}`}
              placeholder="0.00"
              value={valor}
              onChange={e => setValor(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleGuardar(); if (e.key === "Escape") handleCancelar() }}
              className="w-28 h-7 rounded border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-zinc-800 px-2 text-sm text-right text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 tabular-nums"
            />
            <button type="button" title="Guardar" onClick={handleGuardar} disabled={saving} className="h-7 w-7 rounded flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </button>
            <button type="button" title="Cancelar" onClick={handleCancelar} className="h-7 w-7 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2">
            <span className={`text-sm font-medium tabular-nums ${tieneReal ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-300 dark:text-zinc-600"}`}>
              {tieneReal ? fmtDec(real!) : "—"}
            </span>
            <button
              type="button"
              title={`Editar ${categoria}`}
              onClick={handleEditar}
              className="h-6 w-6 rounded flex items-center justify-center text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </td>

      {/* Diferencia */}
      <td className="px-4 py-3 text-right text-sm tabular-nums">
        {diferencia === null ? (
          <span className="text-zinc-300 dark:text-zinc-600">—</span>
        ) : diferencia === 0 ? (
          <span className="text-zinc-400">$0</span>
        ) : diferencia > 0 ? (
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">+{fmt(diferencia)}</span>
        ) : (
          <span className="text-red-500 dark:text-red-400 font-medium">{fmt(diferencia)}</span>
        )}
      </td>

      {/* Barra visual */}
      <td className="px-4 py-3 w-32 hidden md:table-cell">
        {tieneReal && presupuestado > 0 && (() => {
          const pct    = Math.min(150, Math.round((real! / presupuestado) * 100))
          const over   = pct > 100
          const barPct = Math.min(100, pct)
          return (
            <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${over ? "bg-red-400" : esIngreso ? "bg-emerald-400" : "bg-indigo-400"} w-[var(--bar-w)]`}
                style={{ "--bar-w": `${barPct}%` } as React.CSSProperties}
              />
            </div>
          )
        })()}
      </td>
    </tr>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function RegistroMensualPage() {
  const hoy   = new Date()
  const [mes,  setMes]  = useState(hoy.getMonth() + 1)
  const [anio, setAnio] = useState(hoy.getFullYear())

  const { registros: dataRegistros, loading: loadR, error } = useGetRegistros()
  const { partidas: dataPartidas,   loading: loadP }        = useGetPartidas()

  const [registros, setRegistros] = useState<RegistroMensualType[]>([])

  useEffect(() => { setRegistros(dataRegistros ?? []) }, [dataRegistros])

  const loading = loadR || loadP

  // Registros del mes seleccionado
  const registrosMes = registros.filter(r => r.mes === mes && r.anio === anio)

  const getRegistro = (cat: string) =>
    registrosMes.find(r => r.categoria === cat)

  const handleSaved = (saved: RegistroMensualType) => {
    setRegistros(prev => {
      const existe = prev.find(r => r.documentId === saved.documentId)
      return existe ? prev.map(r => r.documentId === saved.documentId ? saved : r) : [...prev, saved]
    })
  }

  // ─── Presupuesto base por categoría ───────────────────────────────────────
  const partidas = (dataPartidas ?? []).filter(p => p.activo !== false)

  const presupuestadoPorCat = (cat: string) =>
    partidas
      .filter(p => p.categoria === cat)
      .reduce((s, p) => s + calcMensual(p.monto ?? 0, p.frecuencia), 0)

  // ─── Totales ──────────────────────────────────────────────────────────────
  const totalIngresoPlan  = presupuestadoPorCat(CATEGORIA_INGRESO)
  const totalEgresoPlan   = CATEGORIAS_EGRESO.reduce((s, c) => s + presupuestadoPorCat(c), 0)

  const regIngreso = getRegistro(CATEGORIA_INGRESO)
  const totalIngresoReal = regIngreso ? regIngreso.monto : null
  const totalEgresoReal  = CATEGORIAS_EGRESO.reduce((s, c) => {
    const r = getRegistro(c)
    return r ? s + r.monto : s
  }, 0)
  const categoriasCerradas = CATEGORIAS_EGRESO.filter(c => getRegistro(c)).length
  const egresoRealCompleto = categoriasCerradas === CATEGORIAS_EGRESO.length

  const flujoReal = totalIngresoReal !== null
    ? totalIngresoReal - totalEgresoReal
    : null
  const flujoPlan = totalIngresoPlan - totalEgresoPlan

  // ─── Navegación ───────────────────────────────────────────────────────────
  const irAntes = () => mes === 1 ? (setMes(12), setAnio(a => a - 1)) : setMes(m => m - 1)
  const irDespues = () => mes === 12 ? (setMes(1), setAnio(a => a + 1)) : setMes(m => m + 1)

  // ─── Historial barras ─────────────────────────────────────────────────────
  const historial = Array.from({ length: 6 }, (_, i) => {
    const d   = new Date(anio, mes - 1 - i, 1)
    const m   = d.getMonth() + 1
    const a   = d.getFullYear()
    const regs = registros.filter(r => r.mes === m && r.anio === a)
    const ing  = regs.find(r => r.categoria === CATEGORIA_INGRESO)?.monto ?? null
    const gas  = CATEGORIAS_EGRESO.reduce((s, c) => {
      const r = regs.find(x => x.categoria === c)
      return r ? s + r.monto : s
    }, 0)
    const flujo = ing !== null ? ing - gas : null
    return { m, a, label: `${MESES[m-1].slice(0,3)} ${a}`, flujo, hasData: regs.length > 0 }
  }).reverse()
  const maxAbs = Math.max(...historial.map(h => Math.abs(h.flujo ?? 0)), 1)

  if (error) return <div className="text-sm text-red-500 p-8">Error: {error}</div>

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Cierre Mensual</h1>
          <p className="text-sm text-zinc-500">Registra lo que realmente ganaste y gastaste por categoría.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" title="Mes anterior" onClick={irAntes} className="h-9 w-9 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <ChevronLeft className="h-4 w-4 text-zinc-500" />
          </button>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 min-w-[130px] text-center">
            {MESES[mes - 1]} {anio}
          </span>
          <button type="button" title="Mes siguiente" onClick={irDespues} className="h-9 w-9 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <ChevronRight className="h-4 w-4 text-zinc-500" />
          </button>
        </div>
      </div>

      {/* KPIs del mes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Ingreso Real",
            plan: totalIngresoPlan,
            real: totalIngresoReal,
            color: "text-emerald-600 dark:text-emerald-400",
          },
          {
            label: "Egreso Real",
            plan: totalEgresoPlan,
            real: egresoRealCompleto ? totalEgresoReal : null,
            color: "text-red-500 dark:text-red-400",
          },
          {
            label: "Flujo Neto Real",
            plan: flujoPlan,
            real: flujoReal,
            color: flujoReal !== null
              ? flujoReal >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-red-600 dark:text-red-400"
              : "text-zinc-400",
          },
          {
            label: "Categorías cerradas",
            plan: CATEGORIAS_EGRESO.length,
            real: categoriasCerradas,
            color: categoriasCerradas === CATEGORIAS_EGRESO.length ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
            isCount: true,
          },
        ].map(k => (
          <Card key={k.label} className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{k.label}</p>
            <p className={`text-xl font-bold mt-1 ${k.color}`}>
              {loading ? "…" : k.isCount
                ? `${k.real ?? 0} / ${k.plan}`
                : k.real !== null ? fmtDec(k.real) : "—"
              }
            </p>
            {!k.isCount && (
              <p className="text-xs text-zinc-400 mt-0.5">
                Planeado: {loading ? "…" : fmt(k.plan)}
              </p>
            )}
          </Card>
        ))}
      </div>

      {/* Tabla presupuesto vs real */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 overflow-hidden rounded-xl">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
              <tr>
                <th className="h-10 px-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Categoría</th>
                <th className="h-10 px-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Presupuestado</th>
                <th className="h-10 px-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Real</th>
                <th className="h-10 px-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Diferencia</th>
                <th className="h-10 px-4 hidden md:table-cell" scope="col"><span className="sr-only">Barra</span></th>
              </tr>
            </thead>
            <tbody>

              {/* Sección Ingresos */}
              <tr className="bg-emerald-50/60 dark:bg-emerald-500/5 border-b border-zinc-100 dark:border-zinc-800">
                <td colSpan={5} className="px-4 py-2">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Ingresos</span>
                </td>
              </tr>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-3"><div className="h-4 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" /></td></tr>
              ) : (
                <FilaCategoria
                  categoria={CATEGORIA_INGRESO}
                  presupuestado={presupuestadoPorCat(CATEGORIA_INGRESO)}
                  registro={getRegistro(CATEGORIA_INGRESO)}
                  mes={mes} anio={anio} esIngreso={true}
                  onSaved={handleSaved}
                />
              )}

              {/* Sección Egresos */}
              <tr className="bg-red-50/60 dark:bg-red-500/5 border-y border-zinc-100 dark:border-zinc-800">
                <td colSpan={5} className="px-4 py-2">
                  <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Egresos</span>
                </td>
              </tr>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" /></td></tr>
                  ))
                : CATEGORIAS_EGRESO.map(cat => (
                    <FilaCategoria
                      key={cat}
                      categoria={cat}
                      presupuestado={presupuestadoPorCat(cat)}
                      registro={getRegistro(cat)}
                      mes={mes} anio={anio} esIngreso={false}
                      onSaved={handleSaved}
                    />
                  ))
              }

              {/* Fila de totales */}
              {!loading && (
                <tr className="border-t-2 border-zinc-300 dark:border-zinc-600 bg-zinc-900 dark:bg-zinc-950">
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Flujo neto</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-bold ${flujoPlan >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {fmt(flujoPlan)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-bold ${flujoReal === null ? "text-zinc-500" : flujoReal >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {flujoReal !== null ? fmtDec(flujoReal) : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {flujoReal !== null && (() => {
                      const delta = flujoReal - flujoPlan
                      return (
                        <span className={`text-sm font-bold ${delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {delta >= 0 ? "+" : ""}{fmt(delta)}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="hidden md:table-cell" />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Historial 6 meses */}
      <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Flujo neto — últimos 6 meses</h2>
        {loading ? (
          <div className="h-24 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        ) : (
          <div className="flex items-end gap-3 h-28">
            {historial.map(h => {
              const positivo = (h.flujo ?? 0) >= 0
              const pct = h.flujo !== null ? Math.round((Math.abs(h.flujo) / maxAbs) * 100) : 0
              const esMesActual = h.m === mes && h.a === anio
              return (
                <div key={`${h.m}-${h.a}`} className="flex flex-col items-center gap-1 flex-1">
                  <span className={`text-xs font-semibold ${h.flujo === null ? "invisible" : positivo ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                    {h.flujo !== null ? fmt(h.flujo) : "x"}
                  </span>
                  <div className="w-full flex items-end justify-center h-14">
                    <div
                      className={`w-full rounded-t transition-all ${h.flujo === null ? "bg-zinc-100 dark:bg-zinc-800" : positivo ? "bg-emerald-400 dark:bg-emerald-500" : "bg-red-400 dark:bg-red-500"} ${esMesActual ? "opacity-100" : "opacity-40"} h-[var(--bar-h)]`}
                      style={{ "--bar-h": `${Math.max(4, pct)}%` } as React.CSSProperties}
                    />
                  </div>
                  <span className={`text-xs ${esMesActual ? "font-bold text-zinc-900 dark:text-zinc-50" : "text-zinc-400"}`}>{h.label}</span>
                </div>
              )
            })}
          </div>
        )}
        <p className="text-xs text-zinc-400 mt-3 text-center">Las barras grises indican meses sin cierre registrado.</p>
      </Card>

    </div>
  )
}
