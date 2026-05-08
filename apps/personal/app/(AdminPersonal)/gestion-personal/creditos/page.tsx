"use client"

import { useState, useMemo } from "react"
import {
  CreditCard, TrendingDown, Calendar, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, Flame, Shield,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { useGetCuentas }       from "@/api/cuenta/getCuentas"
import { useGetTransacciones } from "@/api/transaccion/getTransacciones"
import { CuentaType }          from "@/types/cuenta"
import { TransaccionType }     from "@/types/transaccion"

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fmtK = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n).toLocaleString("es-MX")}`

function mesKey(fecha: string) {
  return fecha.slice(0, 7)
}

function mesLabel(key: string) {
  const [y, m] = key.split("-")
  const d = new Date(Number(y), Number(m) - 1)
  return d.toLocaleDateString("es-MX", { month: "short", year: "2-digit" })
}

// ─── Tarjeta de crédito ──────────────────────────────────────────────────────
function CreditoCard({
  cuenta,
  pagos,
  pagosMes,
  totalPagado,
}: {
  cuenta: CuentaType
  pagos: TransaccionType[]
  pagosMes: number
  totalPagado: number
}) {
  const [histOpen, setHistOpen] = useState(false)

  const deuda      = cuenta.saldoActual ?? cuenta.saldoInicial ?? 0
  const limite     = cuenta.metaDeCuenta ?? 0  // metaDeCuenta = límite de crédito
  const utilizado  = limite > 0 ? Math.min(100, (deuda / limite) * 100) : 0
  const disponible = limite > 0 ? Math.max(0, limite - deuda) : 0
  const liquidado  = deuda <= 0

  // Nivel de riesgo por utilización
  const riesgo = utilizado > 80 ? "alto" : utilizado > 50 ? "medio" : "bajo"
  const riesgoColor = {
    alto:  { bar: "bg-red-500",    text: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30" },
    medio: { bar: "bg-amber-500",  text: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/30" },
    bajo:  { bar: "bg-emerald-500",text: "text-emerald-400",bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  }[riesgo]

  // Pagos por mes (últimos 6)
  const pagosPorMes = useMemo(() => {
    const map: Record<string, number> = {}
    pagos.forEach(tx => {
      const k = mesKey(tx.fecha)
      map[k] = (map[k] ?? 0) + Number(tx.monto)
    })
    const keys = Object.keys(map).sort().slice(-6)
    return keys.map(k => ({ mes: k, monto: map[k] }))
  }, [pagos])

  const promedioPago = pagosPorMes.length > 0
    ? pagosPorMes.reduce((s, p) => s + p.monto, 0) / pagosPorMes.length
    : 0

  // Estimación de meses para liquidar
  const mesesParaLiquidar = promedioPago > 0 && deuda > 0
    ? Math.ceil(deuda / promedioPago)
    : null

  return (
    <Card className={`border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 overflow-hidden ${liquidado ? "ring-2 ring-emerald-400 dark:ring-emerald-500" : ""}`}>
      {/* Header con color de cuenta */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center shadow-sm"
              style={{ backgroundColor: (cuenta.color ?? "#ef4444") + "20" }}
            >
              <CreditCard className="h-5 w-5" style={{ color: cuenta.color ?? "#ef4444" }} />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 leading-tight">{cuenta.nombre}</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {cuenta.proposito ?? "Crédito"}
                {limite > 0 && ` · Límite: ${fmt(limite)}`}
              </p>
            </div>
          </div>
          {liquidado ? (
            <div className="flex items-center gap-1 text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-xs font-semibold">Liquidado</span>
            </div>
          ) : (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${riesgoColor.bg} ${riesgoColor.text} border ${riesgoColor.border}`}>
              {riesgo === "alto" ? <Flame className="h-3 w-3" /> : riesgo === "medio" ? <AlertTriangle className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
              {utilizado.toFixed(0)}% usado
            </div>
          )}
        </div>

        {/* Deuda actual */}
        <div className="mt-4">
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{fmt(deuda)}</span>
            {limite > 0 && !liquidado && (
              <span className="text-xs text-zinc-400">
                Disponible: <span className="font-semibold text-zinc-600 dark:text-zinc-300">{fmtK(disponible)}</span>
              </span>
            )}
          </div>

          {/* Barra de utilización */}
          {limite > 0 && (
            <div className="mt-2 space-y-1">
              <div className="h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${riesgoColor.bar}`}
                  style={{ width: `${utilizado}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span>$0</span>
                <span>{fmtK(limite)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats rápidos */}
      {!liquidado && (
        <div className="px-5 pb-4 grid grid-cols-2 gap-3 border-t border-zinc-50 dark:border-zinc-800/60 pt-3">
          <div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Pagado este mes</p>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{fmt(pagosMes)}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Pago promedio</p>
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{fmt(promedioPago)}/mes</p>
          </div>
          {mesesParaLiquidar !== null && (
            <div className="col-span-2">
              <p className="text-xs text-zinc-500">
                Al ritmo actual:{" "}
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {mesesParaLiquidar === 1 ? "1 mes" : `${mesesParaLiquidar} meses`}
                </span>
                {" "}para liquidar
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mini gráfico de pagos por mes */}
      {pagosPorMes.length > 0 && (
        <div className="px-5 pb-3 border-t border-zinc-50 dark:border-zinc-800/60 pt-3">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Pagos mensuales</p>
          <div className="flex items-end gap-1 h-12">
            {pagosPorMes.map((p, i) => {
              const max = Math.max(...pagosPorMes.map(x => x.monto))
              const h   = max > 0 ? (p.monto / max) * 100 : 0
              return (
                <div key={p.mes} className="flex-1 flex flex-col items-center gap-0.5" title={`${mesLabel(p.mes)}: ${fmt(p.monto)}`}>
                  <div className="w-full rounded-t bg-emerald-400/80 dark:bg-emerald-500/60 transition-all" style={{ height: `${Math.max(4, h)}%` }} />
                  <span className="text-[8px] text-zinc-400">{mesLabel(p.mes)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Historial de pagos (expandible) */}
      {pagos.length > 0 && (
        <div className="border-t border-zinc-50 dark:border-zinc-800/60">
          <button
            className="w-full px-5 py-2.5 flex items-center justify-between text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            onClick={() => setHistOpen(!histOpen)}
          >
            <span className="font-semibold uppercase tracking-wider">Historial ({pagos.length})</span>
            {histOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {histOpen && (
            <div className="px-5 pb-3 space-y-1 max-h-40 overflow-y-auto">
              {pagos.slice(0, 20).map((tx, i) => (
                <div key={tx.documentId ?? i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-zinc-400">
                      {new Date(tx.fecha).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                    </span>
                    <span className="text-zinc-500 truncate">{tx.descripcion}</span>
                  </div>
                  <span className="font-semibold text-emerald-500 shrink-0">-{fmt(Number(tx.monto))}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Liquidado */}
      {liquidado && (
        <div className="px-5 pb-4 text-center border-t border-zinc-50 dark:border-zinc-800/60 pt-3">
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Deuda liquidada</p>
          {totalPagado > 0 && <p className="text-xs text-zinc-400 mt-0.5">Total pagado: {fmt(totalPagado)}</p>}
        </div>
      )}
    </Card>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function CreditosPage() {
  const { cuentas, loading: loadC }                                    = useGetCuentas()
  const { transacciones, loading: loadT }                              = useGetTransacciones()

  // Cuentas tipo crédito
  const creditos = useMemo(() =>
    cuentas.filter(c => c.activa && c.tipo === "Crédito"),
    [cuentas]
  )

  // Transacciones relevantes: pagos a créditos (gasto con cuentaOrigen = crédito, o transferencia a crédito)
  const pagosPorCredito = useMemo(() => {
    const map: Record<string, TransaccionType[]> = {}
    creditos.forEach(c => { map[c.documentId] = [] })

    transacciones.forEach(tx => {
      // Pago a tarjeta: transferencia donde destino es crédito, o gasto desde crédito
      const destinoId = tx.cuentaDestino?.documentId
      const origenId  = tx.cuentaOrigen?.documentId

      // Transferencia hacia crédito = pago de deuda
      if (destinoId && map[destinoId] !== undefined && tx.tipo === "transferencia") {
        map[destinoId].push(tx)
      }
      // Gasto desde crédito = aumento de deuda (lo mostramos diferente)
      // Para el historial solo mostramos pagos, no compras
    })

    return map
  }, [creditos, transacciones])

  // Compras con crédito (gastos desde cuentas crédito)
  const comprasPorCredito = useMemo(() => {
    const map: Record<string, TransaccionType[]> = {}
    creditos.forEach(c => { map[c.documentId] = [] })

    transacciones.forEach(tx => {
      const origenId = tx.cuentaOrigen?.documentId
      if (origenId && map[origenId] !== undefined && tx.tipo === "gasto") {
        map[origenId].push(tx)
      }
    })

    return map
  }, [creditos, transacciones])

  // Mes actual
  const mesActual = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  }, [])

  // Totales
  const totalDeuda = creditos.reduce((s, c) => s + (c.saldoActual ?? c.saldoInicial ?? 0), 0)
  const totalLimite = creditos.reduce((s, c) => s + (c.metaDeCuenta ?? 0), 0)

  const totalPagadoMes = useMemo(() => {
    return Object.values(pagosPorCredito)
      .flat()
      .filter(tx => mesKey(tx.fecha) === mesActual)
      .reduce((s, tx) => s + Number(tx.monto), 0)
  }, [pagosPorCredito, mesActual])

  const totalGastadoMes = useMemo(() => {
    return Object.values(comprasPorCredito)
      .flat()
      .filter(tx => mesKey(tx.fecha) === mesActual)
      .reduce((s, tx) => s + Number(tx.monto), 0)
  }, [comprasPorCredito, mesActual])

  const creditosLiquidados = creditos.filter(c => (c.saldoActual ?? c.saldoInicial ?? 0) <= 0)
  const creditosActivos    = creditos.filter(c => (c.saldoActual ?? c.saldoInicial ?? 0) > 0)

  const loading = loadC || loadT

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-red-400" /> Créditos
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Gestión y seguimiento de deudas de crédito.
          {creditos.length > 0 && (
            <span> Cuentas tipo &quot;Crédito&quot; de tu <span className="text-emerald-500 font-medium">Inventario</span>.</span>
          )}
        </p>
      </div>

      {/* Resumen global */}
      {!loading && creditos.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Deuda total",
              value: fmt(totalDeuda),
              color: totalDeuda > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400",
              icon: <CreditCard className="h-4 w-4 text-red-400" />,
            },
            {
              label: "Pagado este mes",
              value: fmt(totalPagadoMes),
              color: "text-emerald-600 dark:text-emerald-400",
              icon: <TrendingDown className="h-4 w-4 text-emerald-400" />,
            },
            {
              label: "Gastado este mes",
              value: fmt(totalGastadoMes),
              color: "text-amber-600 dark:text-amber-400",
              icon: <Flame className="h-4 w-4 text-amber-400" />,
            },
            {
              label: "Utilización global",
              value: totalLimite > 0 ? `${Math.round((totalDeuda / totalLimite) * 100)}%` : "—",
              color: totalLimite > 0 && (totalDeuda / totalLimite) > 0.8
                ? "text-red-600 dark:text-red-400"
                : totalLimite > 0 && (totalDeuda / totalLimite) > 0.5
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400",
              icon: <Calendar className="h-4 w-4 text-zinc-400" />,
            },
          ].map(k => (
            <Card key={k.label} className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
              <div className="flex items-center gap-2 mb-1">
                {k.icon}
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{k.label}</p>
              </div>
              <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Barra de deuda total */}
      {!loading && totalLimite > 0 && totalDeuda > 0 && (
        <Card className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Deuda global vs Límite</p>
            <p className="text-sm text-zinc-500">
              {fmt(totalDeuda)} / {fmt(totalLimite)}
            </p>
          </div>
          <div className="h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                (totalDeuda / totalLimite) > 0.8 ? "bg-red-500" :
                (totalDeuda / totalLimite) > 0.5 ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, (totalDeuda / totalLimite) * 100)}%` }}
            />
          </div>
        </Card>
      )}

      {/* Grid de créditos activos */}
      {creditosActivos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-48 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
              ))
            : creditosActivos.map(c => {
                const pagos = pagosPorCredito[c.documentId] ?? []
                const pagosMesActual = pagos
                  .filter(tx => mesKey(tx.fecha) === mesActual)
                  .reduce((s, tx) => s + Number(tx.monto), 0)
                const totalPagado = pagos.reduce((s, tx) => s + Number(tx.monto), 0)
                return (
                  <CreditoCard
                    key={c.documentId}
                    cuenta={c}
                    pagos={pagos}
                    pagosMes={pagosMesActual}
                    totalPagado={totalPagado}
                  />
                )
              })
          }
        </div>
      )}

      {/* Créditos liquidados */}
      {creditosLiquidados.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Liquidados ({creditosLiquidados.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 opacity-80">
            {creditosLiquidados.map(c => {
              const pagos = pagosPorCredito[c.documentId] ?? []
              const totalPagado = pagos.reduce((s, tx) => s + Number(tx.monto), 0)
              return (
                <CreditoCard
                  key={c.documentId}
                  cuenta={c}
                  pagos={pagos}
                  pagosMes={0}
                  totalPagado={totalPagado}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && creditos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CreditCard className="h-12 w-12 text-zinc-200 dark:text-zinc-700 mb-4" />
          <p className="text-zinc-500 font-medium">Sin cuentas de crédito</p>
          <p className="text-sm text-zinc-400 mt-1 max-w-sm">
            Agrega una cuenta tipo <span className="font-semibold text-emerald-500">&quot;Crédito&quot;</span> en{" "}
            <a href="/gestion-personal/cuentas" className="text-emerald-500 hover:underline">Inventario</a>{" "}
            para ver el seguimiento aquí. Usa el campo &quot;Meta de cuenta&quot; como límite de crédito.
          </p>
        </div>
      )}

      {/* Tip */}
      {!loading && creditos.length > 0 && (
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 p-4 text-xs text-zinc-500">
          <p className="font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Cómo funciona</p>
          <ul className="space-y-0.5 list-disc list-inside">
            <li>Las cuentas tipo &quot;Crédito&quot; de <span className="text-emerald-500">Inventario</span> aparecen aquí automáticamente.</li>
            <li>El campo <span className="font-medium">Meta de cuenta</span> = límite de crédito.</li>
            <li>Registra pagos como <span className="font-medium">transferencia</span> en el Calendario (cuenta origen → crédito destino).</li>
            <li>Las compras con crédito son gastos con cuenta origen = tu tarjeta.</li>
          </ul>
        </div>
      )}
    </div>
  )
}
