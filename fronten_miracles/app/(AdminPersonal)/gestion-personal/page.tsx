"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts"
import {
  Star, ChevronRight, TrendingUp, TrendingDown,
  Wallet, CreditCard, DollarSign, Target,
  Swords, Map, Package, BarChart3, CalendarDays, ArrowLeftRight,
  Shield, Zap, Heart,
} from "lucide-react"

import { useGetPartidas }      from "@/api/partida-presupuesto/getPartidas"
import { useGetActivos }       from "@/api/activo/getActivos"
import { useGetPasivos }       from "@/api/pasivo/getPasivos"
import { useGetPrestamos }     from "@/api/prestamo-otorgado/getPrestamos"
import { useGetTransacciones } from "@/api/transaccion/getTransacciones"
import { useGetCuentas }       from "@/api/cuenta/getCuentas"
import { useGetMetas }         from "@/api/meta-ahorro/getMetas"

import { PartidaPresupuestoType } from "@/types/partida-presupuesto"
import { ActivoType }             from "@/types/activo"
import { PasivoType }             from "@/types/pasivo"
import { PrestamoOtorgadoType }   from "@/types/prestamo-otorgado"

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  `$${Math.round(n).toLocaleString("es-MX")}`

const fmtK = (n: number) =>
  Math.abs(n) >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`

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

const MESES_CORTO = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

// ─── Level System ─────────────────────────────────────────────────────────────
function calcLevel(stats: {
  patrimonioNeto: number; ratioSupervivencia: number
  pctAhorro: number; metasCompletadas: number; flujoNeto: number
}) {
  let xp = 0
  if (stats.patrimonioNeto > 0) xp += Math.min(300, stats.patrimonioNeto / 1000)
  xp += Math.min(200, stats.ratioSupervivencia * 33)
  xp += Math.min(150, stats.pctAhorro * 5)
  xp += stats.metasCompletadas * 50
  if (stats.flujoNeto > 0) xp += 100
  const level = Math.max(1, Math.floor(xp / 100) + 1)
  return { level: Math.min(level, 99), xpInLevel: Math.round(xp % 100), xpToNext: 100 }
}

function getLevelTitle(level: number) {
  if (level >= 20) return "Maestro Financiero"
  if (level >= 15) return "Estratega Dorado"
  if (level >= 10) return "Guardian del Tesoro"
  if (level >= 7)  return "Explorador Fiscal"
  if (level >= 4)  return "Aprendiz de Oro"
  return "Novato Financiero"
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function OverviewCard({ label, value, sub, icon: Icon, color, delay }: {
  label: string; value: string; sub?: string
  icon: React.ElementType; color: string; delay: number
}) {
  const colors: Record<string, { icon: string; border: string; bg: string }> = {
    green:  { icon: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/10" },
    red:    { icon: "text-red-400",     border: "border-red-500/20",     bg: "bg-red-500/10"     },
    blue:   { icon: "text-cyan-400",    border: "border-cyan-500/20",    bg: "bg-cyan-500/10"    },
    purple: { icon: "text-violet-400",  border: "border-violet-500/20",  bg: "bg-violet-500/10"  },
    amber:  { icon: "text-amber-400",   border: "border-amber-500/20",   bg: "bg-amber-500/10"   },
  }
  const c = colors[color] || colors.blue

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`p-4 rounded-xl bg-slate-900/60 border border-slate-700/40 backdrop-blur-sm`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{label}</p>
          <p className="text-xl font-bold text-slate-100 mt-1 truncate">{value}</p>
          {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
        </div>
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${c.bg} ${c.border} border shrink-0`}>
          <Icon className={`h-4 w-4 ${c.icon}`} />
        </div>
      </div>
    </motion.div>
  )
}

function CategoryBar({ label, monto, total, color }: {
  label: string; monto: number; total: number; color: string
}) {
  const pct = total > 0 ? Math.min(100, (monto / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-300 capitalize truncate max-w-[140px]">{label}</span>
        <span className="text-slate-500 tabular-nums">{fmt(monto)} <span className="text-slate-600">({Math.round(pct)}%)</span></span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-800/80 overflow-hidden border border-slate-700/30">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  )
}

function AccountRow({ nombre, tipo, saldo, color, meta }: {
  nombre: string; tipo: string | null; saldo: number; color: string | null; meta: number | null
}) {
  const isCredit = tipo === "Crédito"
  const pctMeta = meta && meta > 0 ? Math.min(100, (saldo / meta) * 100) : null

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="h-3 w-3 rounded-full shrink-0 border border-slate-700/50" style={{ backgroundColor: color ?? "#6366f1" }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-200 font-medium truncate">{nombre}</p>
          <p className={`text-sm font-bold tabular-nums ${isCredit ? "text-red-400" : "text-emerald-400"}`}>
            {fmt(saldo)}
          </p>
        </div>
        {pctMeta !== null && (
          <div className="mt-1 h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500" style={{ width: `${pctMeta}%` }} />
          </div>
        )}
        {!pctMeta && (
          <p className="text-[10px] text-slate-600">{tipo ?? "Cuenta"}</p>
        )}
      </div>
    </div>
  )
}

function MiniChart({ data, title, colorPositive, colorNegative }: {
  data: { name: string; value: number }[]; title: string
  colorPositive: string; colorNegative?: string
}) {
  return (
    <div className="rounded-xl bg-slate-900/60 border border-slate-700/40 p-4 backdrop-blur-sm">
      <h3 className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#e2e8f0",
            }}
            formatter={(v: number) => [fmt(v), ""]}
            labelStyle={{ color: "#94a3b8" }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={24}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={colorNegative && entry.value < 0 ? colorNegative : colorPositive}
                opacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function ModuleCard({ name, description, icon: Icon, href, color, delay }: {
  name: string; description: string; icon: React.ElementType
  href: string; color: string; delay: number
}) {
  const borders: Record<string, string> = {
    cyan:   "hover:border-cyan-500/50",
    purple: "hover:border-violet-500/50",
    amber:  "hover:border-amber-500/50",
    green:  "hover:border-emerald-500/50",
    blue:   "hover:border-blue-500/50",
    pink:   "hover:border-pink-500/50",
  }
  const icons: Record<string, string> = {
    cyan:   "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    purple: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    amber:  "text-amber-400 bg-amber-500/10 border-amber-500/20",
    green:  "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    blue:   "text-blue-400 bg-blue-500/10 border-blue-500/20",
    pink:   "text-pink-400 bg-pink-500/10 border-pink-500/20",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Link href={href}>
        <div className={`group p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/40 backdrop-blur-sm transition-all duration-300 hover:shadow-lg cursor-pointer ${borders[color]}`}>
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center border shrink-0 ${icons[color]}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-semibold text-slate-200 group-hover:text-white">{name}</h3>
              <p className="text-[10px] text-slate-600">{description}</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-700 group-hover:text-slate-500 shrink-0" />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function GestionPersonalPage() {
  const hoy = new Date()
  const mesActual  = hoy.getMonth() + 1
  const anioActual = hoy.getFullYear()

  const { partidas:       dataPartidas, loading: loadPart  } = useGetPartidas()
  const { activos:        dataActivos,  loading: loadAct   } = useGetActivos()
  const { pasivos:        dataPasivos,  loading: loadPas   } = useGetPasivos()
  const { prestamos:      dataPrest,    loading: loadPrest  } = useGetPrestamos()
  const { transacciones:  dataTx,       loading: loadTx     } = useGetTransacciones()
  const { cuentas:        dataCuentas,  loading: loadCuent  } = useGetCuentas()
  const { metas:          dataMetas,    loading: loadMetas  } = useGetMetas()

  const [partidas,  setPartidas]  = useState<PartidaPresupuestoType[]>([])
  const [activos,   setActivos]   = useState<ActivoType[]>([])
  const [pasivos,   setPasivos]   = useState<PasivoType[]>([])
  const [prestamos, setPrestamos] = useState<PrestamoOtorgadoType[]>([])

  useEffect(() => { setPartidas(dataPartidas ?? []) }, [dataPartidas])
  useEffect(() => { setActivos(dataActivos   ?? []) }, [dataActivos])
  useEffect(() => { setPasivos(dataPasivos   ?? []) }, [dataPasivos])
  useEffect(() => { setPrestamos(dataPrest   ?? []) }, [dataPrest])

  const loading = loadPart || loadAct || loadPas || loadPrest || loadTx || loadCuent || loadMetas
  const transacciones = dataTx ?? []

  const cuentas = dataCuentas ?? []
  const metas   = dataMetas ?? []

  // ─── Calculos principales ───────────────────────────────────────────────
  const activasPartidas = partidas.filter(p => p.activo !== false)

  const ingresoMensual = activasPartidas
    .filter(p => p.categoria === "ingreso" || p.tipo === "ingreso")
    .reduce((s, p) => s + calcMensual(p.monto ?? 0, p.frecuencia), 0)

  const egresoMensual = activasPartidas
    .filter(p => p.categoria !== "ingreso" && p.tipo !== "ingreso")
    .reduce((s, p) => s + calcMensual(p.monto ?? 0, p.frecuencia), 0)

  const mesStr = `${anioActual}-${String(mesActual).padStart(2, "0")}`
  const txMes = transacciones.filter(tx => tx.fecha.slice(0, 7) === mesStr)
  const ingresoRealMes = txMes.filter(tx => tx.tipo === "ingreso").reduce((s, tx) => s + Number(tx.monto), 0)
  const gastoRealMes   = txMes.filter(tx => tx.tipo === "gasto").reduce((s, tx) => s + Number(tx.monto), 0)

  const flujoNeto = (ingresoMensual + ingresoRealMes) - (egresoMensual + gastoRealMes)

  // Cuentas
  const cuentasActivas = cuentas.filter(c => c.activa)
  const cuentasLiquidas = cuentasActivas.filter(c => c.tipo !== "Crédito")
  const cuentasCredito  = cuentasActivas.filter(c => c.tipo === "Crédito")
  const disponible     = cuentasLiquidas.reduce((s, c) => s + (c.saldoActual ?? c.saldoInicial ?? 0), 0)
  const deudaTotal     = cuentasCredito.reduce((s, c) => s + (c.saldoActual ?? c.saldoInicial ?? 0), 0)
  const balanceActual  = disponible - deudaTotal

  // Gasto del mes (presupuestado + real)
  const gastoDelMes = egresoMensual + gastoRealMes

  // Balance proyectado: balance actual + ingresos restantes del mes - egresos restantes
  const diasMes = new Date(anioActual, mesActual, 0).getDate()
  const diasRestantes = diasMes - hoy.getDate()
  const pctRestante = diasRestantes / diasMes
  const balanceProyectado = balanceActual + (ingresoMensual * pctRestante) - (egresoMensual * pctRestante)

  // Patrimonio
  const totalActivos   = activos.reduce((s, a) => s + (a.valor ?? 0), 0)
  const totalPrestamos = prestamos.filter(p => p.estado === "activo").reduce((s, p) => s + (p.saldo_pendiente ?? 0), 0)
  const totalPasivos   = pasivos.reduce((s, p) => s + (p.saldo ?? 0), 0)
  const patrimonioNeto = totalActivos + totalPrestamos - totalPasivos

  // Supervivencia
  const efectivoLiquido = activos
    .filter(a => a.categoria === "efectivo" || a.categoria === "inversion")
    .reduce((s, a) => s + (a.valor ?? 0), 0)
  const ratioSupervivencia = egresoMensual > 0 ? efectivoLiquido / egresoMensual : 0

  const ahorroMensual = activasPartidas
    .filter(p => p.tipo === "ahorro")
    .reduce((s, p) => s + calcMensual(p.monto ?? 0, p.frecuencia), 0)
  const pctAhorro = ingresoMensual > 0 ? (ahorroMensual / ingresoMensual) * 100 : 0

  // Categorias de gasto
  const necesidades = activasPartidas
    .filter(p => p.tipo === "necesidad")
    .reduce((s, p) => s + calcMensual(p.monto ?? 0, p.frecuencia), 0)
  const prescindibles = activasPartidas
    .filter(p => p.tipo === "gastos prescindibles")
    .reduce((s, p) => s + calcMensual(p.monto ?? 0, p.frecuencia), 0)

  // Metas
  const metasActivas = metas.filter(m => m.activo !== false)
  const metasCompletadas = metasActivas.filter(m => m.monto_actual >= m.monto_meta).length

  // Level
  const { level, xpInLevel, xpToNext } = calcLevel({
    patrimonioNeto, ratioSupervivencia, pctAhorro, metasCompletadas, flujoNeto,
  })
  const titulo = getLevelTitle(level)

  // ─── Monthly chart data (ultimos 6 meses) ──────────────────────────────
  const chartData = useMemo(() => {
    const months: { mes: number; anio: number; label: string; key: string }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(anioActual, mesActual - 1 - i, 1)
      months.push({
        mes: d.getMonth() + 1,
        anio: d.getFullYear(),
        label: MESES_CORTO[d.getMonth()],
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      })
    }

    const ingresos = months.map(m => {
      const txIng = transacciones
        .filter(tx => tx.fecha.slice(0, 7) === m.key && tx.tipo === "ingreso")
        .reduce((s, tx) => s + Number(tx.monto), 0)
      return { name: m.label, value: Math.round(ingresoMensual + txIng) }
    })

    const gastos = months.map(m => {
      const txGas = transacciones
        .filter(tx => tx.fecha.slice(0, 7) === m.key && tx.tipo === "gasto")
        .reduce((s, tx) => s + Number(tx.monto), 0)
      return { name: m.label, value: Math.round(egresoMensual + txGas) }
    })

    const balance = months.map((m, i) => ({
      name: m.label,
      value: ingresos[i].value - gastos[i].value,
    }))

    return { ingresos, gastos, balance }
  }, [transacciones, ingresoMensual, egresoMensual, mesActual, anioActual])

  // Modules
  const modules = [
    { name: "Finanzas",    description: "Presupuesto y flujo",       icon: Swords,       href: "/gestion-personal/presupuesto",      color: "cyan"   },
    { name: "Misiones",    description: "Metas de ahorro",           icon: Map,          href: "/gestion-personal/metas",            color: "amber"  },
    { name: "Inventario",  description: "Cuentas y cartera",         icon: Package,      href: "/gestion-personal/cuentas",          color: "green"  },
    { name: "Stats",       description: "Patrimonio y net worth",    icon: BarChart3,    href: "/gestion-personal/patrimonio",       color: "purple" },
    { name: "Calendario",     description: "Eventos y pagos",         icon: CalendarDays,  href: "/gestion-personal/calendario",      color: "blue"   },
    { name: "Transacciones", description: "Movimientos y saldos",  icon: ArrowLeftRight, href: "/gestion-personal/transacciones", color: "cyan"   },
  ]

  // ─── RENDER ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="h-10 w-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full mx-auto"
          />
          <p className="text-sm text-slate-500">Cargando HUD...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto">

      {/* ── Character HUD (compacto) ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800/80 border border-slate-700/50 p-4 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl" />

        <div className="relative flex items-center gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-white text-base font-bold shadow-lg shadow-cyan-500/20">
              RR
            </div>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-md bg-slate-800 border border-cyan-500/50 flex items-center justify-center">
              <span className="text-[9px] font-bold text-cyan-400">{level}</span>
            </div>
          </div>

          {/* Info + XP */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-slate-100">Ricardo</h1>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {titulo}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <Star className="h-3 w-3 text-amber-400 shrink-0" />
              <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(xpInLevel / xpToNext) * 100}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500"
                />
              </div>
              <span className="text-[10px] text-slate-600 tabular-nums shrink-0">{xpInLevel}/{xpToNext}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Overview Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <OverviewCard
          label="Disponible"
          value={fmt(disponible)}
          sub="Cuentas liquidas"
          icon={Wallet}
          color="green"
          delay={0.1}
        />
        <OverviewCard
          label="Balance Actual"
          value={fmt(balanceActual)}
          sub="Liquido - Deuda"
          icon={balanceActual >= 0 ? TrendingUp : TrendingDown}
          color={balanceActual >= 0 ? "blue" : "red"}
          delay={0.15}
        />
        <OverviewCard
          label="Gasto del Mes"
          value={fmt(gastoDelMes)}
          sub={`${hoy.toLocaleString("es-MX", { month: "long" })} ${anioActual}`}
          icon={CreditCard}
          color="red"
          delay={0.2}
        />
        <OverviewCard
          label="Balance Proyectado"
          value={fmt(balanceProyectado)}
          sub={`Faltan ${diasRestantes} dias`}
          icon={Target}
          color={balanceProyectado >= 0 ? "purple" : "red"}
          delay={0.25}
        />
      </div>

      {/* ── Gasto por Categoria + Cuentas ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Gasto por Categoria */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl bg-slate-900/60 border border-slate-700/40 p-4 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gasto por Categoria</h2>
            <Link href="/gestion-personal/presupuesto" className="text-[10px] text-cyan-500 hover:text-cyan-400">Ver detalle</Link>
          </div>
          {egresoMensual === 0 ? (
            <p className="text-xs text-slate-600 text-center py-6">Sin datos de presupuesto</p>
          ) : (
            <div className="space-y-3">
              <CategoryBar label="Necesidades" monto={necesidades} total={egresoMensual} color="bg-gradient-to-r from-cyan-500 to-blue-500" />
              <CategoryBar label="Prescindibles" monto={prescindibles} total={egresoMensual} color="bg-gradient-to-r from-amber-500 to-orange-500" />
              <CategoryBar label="Ahorro" monto={ahorroMensual} total={egresoMensual} color="bg-gradient-to-r from-emerald-400 to-green-500" />
              {gastoRealMes > 0 && (
                <CategoryBar label="Gastos Reales (mes)" monto={gastoRealMes} total={egresoMensual} color="bg-gradient-to-r from-red-500 to-rose-500" />
              )}
            </div>
          )}
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex justify-between text-[10px] text-slate-500">
            <span>Ingreso: <span className="text-emerald-400 font-semibold">{fmt(ingresoMensual)}</span></span>
            <span>Egreso: <span className="text-red-400 font-semibold">{fmt(egresoMensual)}</span></span>
            <span>Flujo: <span className={`font-semibold ${flujoNeto >= 0 ? "text-cyan-400" : "text-red-400"}`}>{fmt(flujoNeto)}</span></span>
          </div>
        </motion.div>

        {/* Cuentas */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl bg-slate-900/60 border border-slate-700/40 p-4 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mis Cuentas</h2>
            <Link href="/gestion-personal/cuentas" className="text-[10px] text-cyan-500 hover:text-cyan-400">Ver todas</Link>
          </div>
          {cuentasActivas.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-6">Sin cuentas activas</p>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {cuentasActivas.map(c => (
                <AccountRow
                  key={c.id}
                  nombre={c.nombre}
                  tipo={c.tipo}
                  saldo={c.saldoActual ?? c.saldoInicial ?? 0}
                  color={c.color}
                  meta={c.metaDeCuenta}
                />
              ))}
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-slate-800/60 flex justify-between text-[10px] text-slate-500">
            <span>Liquido: <span className="text-emerald-400 font-semibold">{fmt(disponible)}</span></span>
            {deudaTotal > 0 && <span>Deuda: <span className="text-red-400 font-semibold">{fmt(deudaTotal)}</span></span>}
          </div>
        </motion.div>
      </div>

      {/* ── Monthly Charts ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MiniChart data={chartData.ingresos} title="Ingresos por Mes" colorPositive="#34d399" />
        <MiniChart data={chartData.gastos} title="Gastos por Mes" colorPositive="#f87171" />
        <MiniChart data={chartData.balance} title="Balance por Mes" colorPositive="#22d3ee" colorNegative="#f87171" />
      </div>

      {/* ── Quick RPG Stats ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl bg-slate-900/60 border border-slate-700/40 p-4 backdrop-blur-sm"
      >
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Stats del Personaje</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-400" />
            <div>
              <p className="text-[10px] text-slate-600">Liquidez</p>
              <p className="text-sm font-bold text-slate-200">{fmt(disponible)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400" />
            <div>
              <p className="text-[10px] text-slate-600">Ahorro</p>
              <p className="text-sm font-bold text-slate-200">{Math.round(pctAhorro)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan-400" />
            <div>
              <p className="text-[10px] text-slate-600">Supervivencia</p>
              <p className="text-sm font-bold text-slate-200">{ratioSupervivencia.toFixed(1)} meses</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-violet-400" />
            <div>
              <p className="text-[10px] text-slate-600">Patrimonio</p>
              <p className="text-sm font-bold text-slate-200">{fmt(patrimonioNeto)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Module Grid ────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">Modulos</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {modules.map((mod, i) => (
            <ModuleCard key={mod.name} {...mod} delay={0.55 + i * 0.05} />
          ))}
        </div>
      </div>

    </div>
  )
}
