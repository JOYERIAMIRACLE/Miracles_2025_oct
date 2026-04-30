"use client"

import { useState, useMemo } from "react"
import { Archive, TrendingUp, TrendingDown } from "lucide-react"
import { useGetSnapshotsCuenta, useGetSnapshotsMes } from "@/api/snapshot/getSnapshots"
import { SnapshotCuentaType } from "@/types/snapshot"

const fmt = (n: number | null | undefined) =>
  `$${Math.round(Number(n ?? 0)).toLocaleString("es-MX")}`

const fmtMes = (yyyymm: string) => {
  const [y, m] = yyyymm.split("-")
  const d = new Date(Number(y), Number(m) - 1, 15)
  return d.toLocaleDateString("es-MX", { month: "long", year: "numeric" })
}

export default function HistorialPage() {
  const { snapshots: snapsMes,    loading: loadM } = useGetSnapshotsMes()
  const { snapshots: snapsCuenta, loading: loadC } = useGetSnapshotsCuenta()
  const [tab, setTab] = useState<"dashboard" | "cuentas">("dashboard")
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<string>("")

  // Cuentas únicas de los snapshots
  const cuentasUnicas = useMemo(() => {
    const map = new Map<string, string>()
    snapsCuenta.forEach(s => map.set(s.cuentaDocId, s.cuentaNombre))
    return [...map.entries()].map(([docId, nombre]) => ({ docId, nombre }))
  }, [snapsCuenta])

  // Agrupa snaps de cuenta por mes (para tabla)
  const snapsCuentaPorMes = useMemo(() => {
    const map = new Map<string, SnapshotCuentaType[]>()
    snapsCuenta.forEach(s => {
      if (!map.has(s.mes)) map.set(s.mes, [])
      map.get(s.mes)!.push(s)
    })
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [snapsCuenta])

  // Snaps filtrados por cuenta para la timeline
  const snapsCuentaFiltrados = useMemo(() => {
    if (!cuentaSeleccionada) return []
    return snapsCuenta
      .filter(s => s.cuentaDocId === cuentaSeleccionada)
      .sort((a, b) => a.mes.localeCompare(b.mes))
  }, [snapsCuenta, cuentaSeleccionada])

  // Para el dashboard: comparación mes a mes
  const snapsMesOrdenados = useMemo(() =>
    [...snapsMes].sort((a, b) => b.mes.localeCompare(a.mes))
  , [snapsMes])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Archive className="h-6 w-6 text-indigo-500" />
        <div>
          <h1 className="text-2xl font-bold">Histórico mensual</h1>
          <p className="text-sm text-muted-foreground">Snapshots guardados al cerrar cada mes</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl mb-6 w-fit">
        {(["dashboard", "cuentas"] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
              tab === t ? "bg-white dark:bg-zinc-900 shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "dashboard" ? "Dashboard por mes" : "Saldos por cuenta"}
          </button>
        ))}
      </div>

      {/* Dashboard tab */}
      {tab === "dashboard" && (
        <div>
          {loadM ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : snapsMesOrdenados.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl">
              <Archive className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Aún no has cerrado ningún mes</p>
              <p className="text-xs text-muted-foreground mt-1">Usa el botón <strong>Cerrar mes</strong> en el Dashboard para guardar tu primer snapshot</p>
            </div>
          ) : (
            <div className="overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-sm min-w-[800px]">
                <thead className="bg-zinc-50 dark:bg-zinc-900/60">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mes</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ingreso</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gasto</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Flujo</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ahorro mes</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ahorro acum.</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Liquidez</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deuda</th>
                  </tr>
                </thead>
                <tbody>
                  {snapsMesOrdenados.map((s, i) => {
                    const prev = snapsMesOrdenados[i + 1]
                    const deltaAhorro = prev ? Number(s.ahorroAcumulado) - Number(prev.ahorroAcumulado) : 0
                    return (
                      <tr key={s.documentId} className="border-t border-zinc-100 dark:border-zinc-800">
                        <td className="px-3 py-2 capitalize font-medium">{fmtMes(s.mes)}</td>
                        <td className="px-3 py-2 text-right text-emerald-600 dark:text-emerald-400">{fmt(s.ingresoReal)}</td>
                        <td className="px-3 py-2 text-right text-red-500">{fmt(s.gastoReal)}</td>
                        <td className={`px-3 py-2 text-right font-semibold ${Number(s.flujoNeto) >= 0 ? "text-emerald-500" : "text-red-500"}`}>{fmt(s.flujoNeto)}</td>
                        <td className="px-3 py-2 text-right">{fmt(s.ahorroReal)}</td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="font-medium">{fmt(s.ahorroAcumulado)}</span>
                            {prev && Math.abs(deltaAhorro) > 0.5 && (
                              <span className={`text-[10px] flex items-center ${deltaAhorro > 0 ? "text-emerald-500" : "text-red-500"}`}>
                                {deltaAhorro > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                {fmt(Math.abs(deltaAhorro))}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right">{fmt(s.liquidezTotal)}</td>
                        <td className="px-3 py-2 text-right text-red-500">{fmt(s.deudaTotal)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Cuentas tab */}
      {tab === "cuentas" && (
        <div>
          {loadC ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : snapsCuenta.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl">
              <Archive className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Aún no hay snapshots de cuentas</p>
            </div>
          ) : (
            <>
              {/* Filtro por cuenta para timeline */}
              <div className="mb-4 flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Ver evolución de:</label>
                <select
                  aria-label="Cuenta"
                  value={cuentaSeleccionada}
                  onChange={e => setCuentaSeleccionada(e.target.value)}
                  className="text-sm h-8 rounded-md border border-zinc-200 dark:border-zinc-700 bg-background px-2"
                >
                  <option value="">— Todas en tabla —</option>
                  {cuentasUnicas.map(c => <option key={c.docId} value={c.docId}>{c.nombre}</option>)}
                </select>
              </div>

              {/* Timeline de una cuenta */}
              {cuentaSeleccionada && snapsCuentaFiltrados.length > 0 && (
                <div className="mb-6 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <h3 className="font-semibold text-sm mb-3">{snapsCuentaFiltrados[0].cuentaNombre} · evolución</h3>
                  <div className="space-y-2">
                    {snapsCuentaFiltrados.map((s, i) => {
                      const prev = snapsCuentaFiltrados[i - 1]
                      const delta = prev ? Number(s.saldoSistema) - Number(prev.saldoSistema) : 0
                      return (
                        <div key={s.documentId} className="flex items-center gap-3 py-1">
                          <span className="w-32 text-xs text-muted-foreground capitalize">{fmtMes(s.mes)}</span>
                          <span className="font-semibold text-sm w-32">{fmt(s.saldoSistema)}</span>
                          {s.saldoBanco != null && (
                            <span className="text-xs text-blue-500 w-32">Banco: {fmt(s.saldoBanco)}</span>
                          )}
                          {prev && Math.abs(delta) > 0.5 && (
                            <span className={`text-xs flex items-center gap-0.5 ${delta > 0 ? "text-emerald-500" : "text-red-500"}`}>
                              {delta > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                              {fmt(Math.abs(delta))}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Tabla por mes */}
              {!cuentaSeleccionada && (
                <div className="space-y-4">
                  {snapsCuentaPorMes.map(([mes, items]) => (
                    <div key={mes} className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                      <div className="bg-zinc-50 dark:bg-zinc-900/60 px-4 py-2">
                        <h3 className="text-sm font-semibold capitalize">{fmtMes(mes)}</h3>
                      </div>
                      <table className="w-full text-sm">
                        <thead className="bg-zinc-50/50 dark:bg-zinc-900/30 text-xs text-muted-foreground">
                          <tr>
                            <th className="text-left px-3 py-1.5">Cuenta</th>
                            <th className="text-left px-3 py-1.5">Propósito</th>
                            <th className="text-right px-3 py-1.5">Sistema</th>
                            <th className="text-right px-3 py-1.5">Banco</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map(s => (
                            <tr key={s.documentId} className="border-t border-zinc-100 dark:border-zinc-800">
                              <td className="px-3 py-2 font-medium">{s.cuentaNombre}</td>
                              <td className="px-3 py-2 text-xs text-muted-foreground">{s.cuentaProposito ?? s.cuentaTipo ?? "—"}</td>
                              <td className="px-3 py-2 text-right">{fmt(s.saldoSistema)}</td>
                              <td className="px-3 py-2 text-right text-blue-500">{s.saldoBanco != null ? fmt(s.saldoBanco) : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
