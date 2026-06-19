"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useGetVentas }   from "@/api/ventaEmpresa/getVentas"
import { useGetClientes } from "@/api/clienteEmpresa/getClientes"
import { EstadoVenta }    from "@/types/ventaEmpresa"
import { StatBar }        from "./StatBar"
import { QuestLog }       from "./QuestLog"

const ACTIVE: EstadoVenta[] = ["Pagado", "Preparando", "Enviado"]
const META_MES = 15_000
const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-MX")}`

export function GameHUDLayout({ children }: { children: React.ReactNode }) {
  const { ventas,   loading: lV } = useGetVentas()
  const { clientes, loading: lC } = useGetClientes()
  const [questOpen, setQuestOpen]  = useState(true)

  const hoy    = new Date()
  const mesStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`

  const gs = useMemo(() => {
    const ventasMes  = ventas.filter(v => v.fecha?.startsWith(mesStr))
    const montoMes   = ventasMes.reduce((s, v) => s + (v.monto ?? 0), 0)
    const activos    = ventas.filter(v => ACTIVE.includes(v.estado as EstadoVenta))
    const entregados = ventas.filter(v => v.estado === "Entregado")
    const pagadas    = ventasMes.filter(v => v.estado !== "Cotizado" && v.estado !== "Cancelado")
    const convPct    = ventasMes.length > 0 ? Math.round((pagadas.length / ventasMes.length) * 100) : 0
    const aliados    = clientes.filter(c => c.Estado === "Activo").length
    const level      = Math.max(1, Math.floor(entregados.length / 3) + 1)
    return { montoMes, activos: activos.length, convPct, aliados, level }
  }, [ventas, clientes, mesStr])

  const loading = lV || lC

  return (
    <div className="flex flex-col min-h-screen bg-[#070b14] text-slate-100">

      {/* ── TOP HUD BAR ── */}
      <header
        className="sticky top-0 z-50 flex items-center gap-3 px-4 py-2 border-b"
        style={{
          borderColor: "rgba(0,212,255,0.07)",
          background:  "rgba(5,8,16,0.97)",
          backdropFilter: "blur(16px)",
        }}
      >
        {/* Back to admin */}
        <Link
          href="/gestion-empresa"
          className="text-[9px] font-mono text-slate-700 hover:text-cyan-400 transition-colors shrink-0 pr-3 border-r border-slate-800"
        >
          ← ADMIN
        </Link>

        {/* Character + Level */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-sm"
            style={{
              background: "linear-gradient(135deg,#0d1f38,#0a1525)",
              border: "1px solid rgba(0,212,255,0.15)",
              boxShadow: "0 0 10px rgba(0,212,255,0.06)",
            }}
          >
            💎
          </div>
          <div className="leading-none">
            <p className="text-[10px] font-bold text-slate-200 tracking-wide">MIRACLES</p>
            <p className="text-[8px] font-mono text-cyan-500/50">
              LV.<span className="text-cyan-400">{loading ? "—" : gs.level}</span>
            </p>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-800 shrink-0" />

        {/* Stat bars */}
        <div className="flex-1 flex items-center gap-4 min-w-0">
          <StatBar
            label="Conversión"
            current={loading ? 0 : gs.convPct}
            max={100}
            color="hp"
            displayValue={loading ? "…" : `${gs.convPct}%`}
            className="w-32 shrink-0"
          />
          <StatBar
            label={`Meta ${fmt(META_MES)}`}
            current={loading ? 0 : Math.min(gs.montoMes, META_MES)}
            max={META_MES}
            color="xp"
            displayValue={loading ? "…" : fmt(gs.montoMes)}
            className="flex-1 max-w-[220px]"
          />
        </div>

        <div className="h-5 w-px bg-slate-800 shrink-0" />

        {/* Quick stats */}
        <div className="flex items-center gap-4 shrink-0">
          {[
            { label: "Oro",     value: loading ? "…" : fmt(gs.montoMes),    color: "text-amber-400"  },
            { label: "Quests",  value: loading ? "…" : String(gs.activos),  color: "text-blue-400"   },
            { label: "Aliados", value: loading ? "…" : String(gs.aliados),  color: "text-violet-400" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-[8px] font-mono text-slate-700 uppercase leading-none mb-0.5">{s.label}</p>
              <p className={`text-[11px] font-bold font-mono tabular-nums ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="h-5 w-px bg-slate-800 shrink-0" />

        {/* Quest log toggle */}
        <button
          onClick={() => setQuestOpen(o => !o)}
          className="text-[9px] font-mono text-slate-700 hover:text-cyan-400 transition-colors shrink-0"
        >
          {questOpen ? "◀ LOG" : "▶ LOG"}
        </button>
      </header>

      {/* ── BODY ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Quest log sidebar */}
        <AnimatePresence initial={false}>
          {questOpen && (
            <motion.aside
              key="ql"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 192, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="shrink-0 border-r overflow-hidden"
              style={{
                borderColor: "rgba(0,212,255,0.06)",
                background:  "rgba(5,8,14,0.7)",
              }}
            >
              <div style={{ width: 192 }}>
                <QuestLog />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
