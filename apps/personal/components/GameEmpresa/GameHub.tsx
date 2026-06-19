"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useGetVentas }   from "@/api/ventaEmpresa/getVentas"
import { useGetClientes } from "@/api/clienteEmpresa/getClientes"
import { EstadoVenta }    from "@/types/ventaEmpresa"

const fmt = (n: number) => `$${Math.round(n).toLocaleString("es-MX")}`
const ACTIVE: EstadoVenta[] = ["Pagado", "Preparando", "Enviado"]

interface Zone {
  id:        string
  icon:      string
  name:      string
  sub:       string
  href:      string
  r: number; g: number; b: number
  stat:      string
  statLabel: string
}

export function GameHub() {
  const { ventas,   loading: lV } = useGetVentas()
  const { clientes, loading: lC } = useGetClientes()

  const hoy    = new Date()
  const mesStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`

  const d = useMemo(() => {
    const montoMes = ventas.filter(v => v.fecha?.startsWith(mesStr)).reduce((s, v) => s + (v.monto ?? 0), 0)
    const activos  = ventas.filter(v => ACTIVE.includes(v.estado as EstadoVenta)).length
    const leads    = clientes.filter(c => c.Funnel === "Lead").length
    const aliados  = clientes.filter(c => c.Estado === "Activo").length
    return { montoMes, activos, leads, aliados }
  }, [ventas, clientes, mesStr])

  const loading = lV || lC
  const lbl = (s: string) => loading ? "…" : s

  const zones: Zone[] = [
    { id: "ventas",      icon: "⚔️", name: "Sala de Conquistas", sub: "Ventas & Pedidos",    href: "/gestion-empresa/ventas",                  r: 16,  g: 185, b: 129, stat: lbl(fmt(d.montoMes)),      statLabel: "este mes"   },
    { id: "pipeline",    icon: "🗺️", name: "Mapa de Quests",     sub: "Pipeline CRM",        href: "/gestion-empresa/ventas/pipeline",          r: 245, g: 158, b: 11,  stat: lbl(`${d.leads} leads`),   statLabel: "en funnel"  },
    { id: "finanzas",    icon: "🏦", name: "Tesorería",           sub: "Finanzas & Cuentas", href: "/gestion-empresa/finanzas",                 r: 59,  g: 130, b: 246, stat: lbl(fmt(d.montoMes)),      statLabel: "recaudado"  },
    { id: "almacen",     icon: "📦", name: "Inventario",          sub: "Almacén & Stock",    href: "/gestion-empresa/almacen/inventario",       r: 124, g: 58,  b: 237, stat: lbl(`${d.activos} activos`),statLabel: "en proceso" },
    { id: "marketing",   icon: "📢", name: "Gremio Mercader",     sub: "Marketing & Camps",  href: "/gestion-empresa/marketing/campanas",       r: 236, g: 72,  b: 153, stat: lbl(`${d.aliados} aliados`),statLabel: "clientes"   },
    { id: "indicadores", icon: "📊", name: "Sala de Tácticas",    sub: "KPIs & Métricas",    href: "/gestion-empresa/indicadores/financieros",  r: 6,   g: 182, b: 212, stat: "Ver KPIs",                 statLabel: "estrategia" },
  ]

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[9px] font-mono text-cyan-500/40 uppercase tracking-[0.25em] mb-1.5">
          ◈ MIRACLES CORP — MAPA PRINCIPAL
        </p>
        <h1 className="text-xl font-bold text-slate-200 tracking-tight">Selecciona una zona</h1>
        <p className="text-[10px] text-slate-700 font-mono mt-1">
          {hoy.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Zone grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {zones.map((z, i) => {
          const a = `${z.r},${z.g},${z.b}`
          return (
            <motion.div
              key={z.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.35, ease: "easeOut" }}
            >
              <Link href={z.href} className="block group">
                <motion.div
                  className="relative overflow-hidden rounded-xl p-4 cursor-pointer"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.12 }}
                  style={{
                    background: `linear-gradient(135deg, rgba(${a},0.07) 0%, rgba(${a},0.02) 100%)`,
                    border: `1px solid rgba(${a},0.15)`,
                    boxShadow: `0 2px 16px rgba(${a},0.05)`,
                    transition: "box-shadow 0.2s ease",
                  }}
                >
                  {/* Radial glow on hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ background: `radial-gradient(circle at 50% 0%, rgba(${a},0.1), transparent 70%)` }}
                  />

                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl">{z.icon}</span>
                      <span className="text-[8px] font-mono text-slate-800 uppercase tracking-widest">
                        ZONA_{z.id.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-200 mb-0.5">{z.name}</h3>
                    <p className="text-[9px] font-mono text-slate-600 mb-3">{z.sub}</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <p
                          className="text-base font-bold font-mono tabular-nums leading-none"
                          style={{ color: `rgb(${a})` }}
                        >
                          {z.stat}
                        </p>
                        <p className="text-[8px] text-slate-700 mt-0.5">{z.statLabel}</p>
                      </div>
                      <span className="text-[9px] font-mono text-slate-800 group-hover:text-slate-500 transition-colors">
                        ▶ ENTRAR
                      </span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {/* Footer line */}
      <div className="mt-8 flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(0,212,255,0.08),transparent)" }} />
        <span className="text-[8px] font-mono text-slate-800">MIRACLES ENTERPRISE v1.0</span>
        <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(0,212,255,0.08),transparent)" }} />
      </div>
    </div>
  )
}
