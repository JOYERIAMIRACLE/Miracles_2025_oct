"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import {
  ArrowUpCircle, ArrowDownCircle, ArrowLeftRight,
  Plus, Pencil, Trash2, X, Filter,
  TrendingUp, TrendingDown, Repeat,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

import { useGetTransacciones } from "@/api/transaccion/getTransacciones"
import { createTransaccion }   from "@/api/transaccion/createTransaccion"
import { updateTransaccion }   from "@/api/transaccion/updateTransaccion"
import { deleteTransaccion }   from "@/api/transaccion/deleteTransaccion"
import { useGetCuentas }       from "@/api/cuenta/getCuentas"
import { useGetCategorias }    from "@/api/categoria/getCategorias"

import {
  TransaccionType, TransaccionPayload,
  TipoTransaccion,
} from "@/types/transaccion"

// ─── Constants ───────────────────────────────────────────────────────────────
const TIPOS: TipoTransaccion[] = ["ingreso", "gasto", "transferencia"]

const TIPO_CONFIG = {
  ingreso:       { icon: ArrowUpCircle,   color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Ingreso"       },
  gasto:         { icon: ArrowDownCircle,  color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20",     label: "Gasto"         },
  transferencia: { icon: ArrowLeftRight,   color: "text-cyan-400",    bg: "bg-cyan-500/10",    border: "border-cyan-500/20",    label: "Transferencia" },
}

const fmt = (n: number) =>
  `$${Math.abs(n).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`

const fmtFecha = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
}

const emptyForm = (): TransaccionPayload => ({
  descripcion: "",
  tipo: "gasto",
  monto: 0,
  fecha: new Date().toISOString().slice(0, 16),
  categoria: null,
  notas: null,
  cuentaOrigen: null,
  cuentaDestino: null,
})

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, bgColor, borderColor, delay }: {
  label: string; value: string; icon: React.ElementType
  color: string; bgColor: string; borderColor: string; delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`p-4 rounded-xl bg-slate-900/60 border border-slate-700/40 backdrop-blur-sm`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{label}</p>
          <p className="text-xl font-bold text-slate-100 mt-1">{value}</p>
        </div>
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${bgColor} ${borderColor} border`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function TransaccionesPage() {
  const { transacciones, setTransacciones, loading } = useGetTransacciones()
  const { cuentas } = useGetCuentas()
  const { categorias } = useGetCategorias()

  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState<TransaccionType | null>(null)
  const [form, setForm] = useState<TransaccionPayload>(emptyForm())
  const [guardando, setGuardando] = useState(false)

  // Categorías filtradas por tipo de transacción (ingreso → ingresos, gasto/transferencia → gastos)
  const categoriasActivas = useMemo(() => categorias.filter(c => c.activa), [categorias])
  const categoriasParaForm = useMemo(() => {
    if (form.tipo === "ingreso") return categoriasActivas.filter(c => c.tipo === "ingreso")
    return categoriasActivas.filter(c => c.tipo === "gasto")
  }, [categoriasActivas, form.tipo])

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<string>("")
  const [filtroCuenta, setFiltroCuenta] = useState<string>("")
  const [filtroCategoria, setFiltroCategoria] = useState<string>("")
  const [filtroMes, setFiltroMes] = useState<string>("")
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  // ── Filtrado ───────────────────────────────────────────────────────────
  const filtradas = useMemo(() => {
    return transacciones.filter(tx => {
      if (filtroTipo && tx.tipo !== filtroTipo) return false
      if (filtroCategoria && tx.categoria !== filtroCategoria) return false
      if (filtroCuenta) {
        const cId = Number(filtroCuenta)
        const matchOrigen  = tx.cuentaOrigen?.id === cId
        const matchDestino = tx.cuentaDestino?.id === cId
        if (!matchOrigen && !matchDestino) return false
      }
      if (filtroMes) {
        const txMes = tx.fecha.slice(0, 7) // "YYYY-MM"
        if (txMes !== filtroMes) return false
      }
      return true
    })
  }, [transacciones, filtroTipo, filtroCuenta, filtroCategoria, filtroMes])

  // ── Totales del mes actual ─────────────────────────────────────────────
  const hoy = new Date()
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`

  const totales = useMemo(() => {
    const delMes = transacciones.filter(tx => tx.fecha.slice(0, 7) === mesActual)
    return {
      ingresos:       delMes.filter(tx => tx.tipo === "ingreso").reduce((s, tx) => s + Number(tx.monto), 0),
      gastos:         delMes.filter(tx => tx.tipo === "gasto").reduce((s, tx) => s + Number(tx.monto), 0),
      transferencias: delMes.filter(tx => tx.tipo === "transferencia").reduce((s, tx) => s + Number(tx.monto), 0),
    }
  }, [transacciones, mesActual])

  // ── CRUD ───────────────────────────────────────────────────────────────
  const abrirCrear = () => {
    setEditando(null)
    setForm(emptyForm())
    setMostrarForm(true)
  }

  const abrirEditar = (tx: TransaccionType) => {
    setEditando(tx)
    setForm({
      descripcion:   tx.descripcion,
      tipo:          tx.tipo,
      monto:         tx.monto,
      fecha:         tx.fecha.slice(0, 16),
      categoria:     tx.categoria,
      notas:         tx.notas,
      cuentaOrigen:  tx.cuentaOrigen?.documentId ?? null,
      cuentaDestino: tx.cuentaDestino?.documentId ?? null,
    })
    setMostrarForm(true)
  }

  const cerrar = () => { setMostrarForm(false); setEditando(null) }

  const handleGuardar = async () => {
    if (!form.descripcion) return toast.error("La descripción es obligatoria")
    if (!form.monto || form.monto <= 0) return toast.error("El monto debe ser mayor a 0")
    if (form.tipo === "gasto" && !form.cuentaOrigen) return toast.error("Selecciona la cuenta origen")
    if (form.tipo === "ingreso" && !form.cuentaDestino) return toast.error("Selecciona la cuenta destino")
    if (form.tipo === "transferencia" && (!form.cuentaOrigen || !form.cuentaDestino)) {
      return toast.error("Selecciona cuenta origen y destino")
    }

    setGuardando(true)
    try {
      if (editando) {
        const updated = await updateTransaccion(editando.documentId, form)
        setTransacciones(prev => prev.map(t => t.documentId === updated.documentId ? { ...t, ...updated } : t))
        toast.success("Transacción actualizada")
      } else {
        const nueva = await createTransaccion(form)
        setTransacciones(prev => [nueva, ...prev])
        toast.success("Transacción registrada")
      }
      cerrar()
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminar = async (tx: TransaccionType) => {
    if (!confirm(`¿Eliminar "${tx.descripcion}"?`)) return
    try {
      await deleteTransaccion(tx.documentId)
      setTransacciones(prev => prev.filter(t => t.documentId !== tx.documentId))
      toast.success("Transacción eliminada")
    } catch (e: any) {
      toast.error(e.message ?? "Error al eliminar")
    }
  }

  const limpiarFiltros = () => {
    setFiltroTipo("")
    setFiltroCuenta("")
    setFiltroCategoria("")
    setFiltroMes("")
  }

  const hayFiltros = filtroTipo || filtroCuenta || filtroCategoria || filtroMes
  const selectCls = "w-full h-8 text-sm border border-slate-700 rounded-lg px-2 bg-slate-800 text-slate-200"

  // ── RENDER ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="h-10 w-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Transacciones</h1>
          <p className="text-sm text-slate-500">Registro completo de movimientos</p>
        </div>
        <Button onClick={abrirCrear} size="sm" className="bg-cyan-600 hover:bg-cyan-700">
          <Plus size={14} className="mr-1" /> Nueva
        </Button>
      </div>

      {/* ── Stats del mes ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Ingresos del mes" value={fmt(totales.ingresos)}
          icon={TrendingUp} color="text-emerald-400" bgColor="bg-emerald-500/10" borderColor="border-emerald-500/20" delay={0.1} />
        <StatCard label="Gastos del mes" value={fmt(totales.gastos)}
          icon={TrendingDown} color="text-red-400" bgColor="bg-red-500/10" borderColor="border-red-500/20" delay={0.15} />
        <StatCard label="Transferencias del mes" value={fmt(totales.transferencias)}
          icon={Repeat} color="text-cyan-400" bgColor="bg-cyan-500/10" borderColor="border-cyan-500/20" delay={0.2} />
      </div>

      {/* ── Filtros ────────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-700/40 p-4 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Filter size={14} />
          Filtros
          {hayFiltros && <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-full">Activos</span>}
        </button>

        {mostrarFiltros && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            <div>
              <Label className="text-[10px] text-slate-500">Tipo</Label>
              <select title="Filtrar por tipo" className={selectCls} value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
                <option value="">Todos</option>
                {TIPOS.map(t => <option key={t} value={t}>{TIPO_CONFIG[t].label}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-[10px] text-slate-500">Cuenta</Label>
              <select title="Filtrar por cuenta" className={selectCls} value={filtroCuenta} onChange={e => setFiltroCuenta(e.target.value)}>
                <option value="">Todas</option>
                {cuentas.filter(c => c.activa).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-[10px] text-slate-500">Categoría</Label>
              <select title="Filtrar por categoría" className={selectCls} value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
                <option value="">Todas</option>
                {categoriasActivas.map(c => <option key={c.documentId} value={c.nombre}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-[10px] text-slate-500">Mes</Label>
              <Input type="month" className="h-8 text-sm bg-slate-800 border-slate-700 text-slate-200" value={filtroMes} onChange={e => setFiltroMes(e.target.value)} />
            </div>
            {hayFiltros && (
              <button type="button" onClick={limpiarFiltros} className="text-[10px] text-red-400 hover:text-red-300 col-span-2 sm:col-span-4">
                Limpiar filtros
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Formulario ─────────────────────────────────────────────────── */}
      {mostrarForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-slate-900/80 border border-slate-700/40 p-5 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-200">{editando ? "Editar transacción" : "Nueva transacción"}</h2>
            <button type="button" title="Cerrar" onClick={cerrar} className="text-slate-500 hover:text-slate-300">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Tipo (botones) */}
            <div className="col-span-2">
              <Label className="text-[10px] text-slate-500">Tipo</Label>
              <div className="flex gap-2 mt-1">
                {TIPOS.map(t => {
                  const cfg = TIPO_CONFIG[t]
                  const active = form.tipo === t
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, tipo: t }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all
                        ${active
                          ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                          : "border-slate-700 text-slate-500 hover:text-slate-300"
                        }`}
                    >
                      <cfg.icon size={14} />
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="col-span-2">
              <Label className="text-[10px] text-slate-500">Descripción</Label>
              <Input className="h-8 text-sm bg-slate-800 border-slate-700 text-slate-200"
                placeholder="Ej: Supermercado, Nómina, Ahorro mensual..."
                value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
            </div>

            <div>
              <Label className="text-[10px] text-slate-500">Monto</Label>
              <Input type="number" className="h-8 text-sm bg-slate-800 border-slate-700 text-slate-200"
                placeholder="0.00" value={form.monto || ""}
                onChange={e => setForm(f => ({ ...f, monto: Number(e.target.value) }))} />
            </div>

            <div>
              <Label className="text-[10px] text-slate-500">Fecha</Label>
              <Input type="datetime-local" className="h-8 text-sm bg-slate-800 border-slate-700 text-slate-200"
                value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
            </div>

            <div>
              <Label className="text-[10px] text-slate-500">Categoría</Label>
              <select title="Categoría" className={selectCls}
                value={form.categoria ?? ""} onChange={e => setForm(f => ({ ...f, categoria: e.target.value || null }))}>
                <option value="">— Seleccionar —</option>
                {categoriasParaForm.map(c => <option key={c.documentId} value={c.nombre}>{c.nombre}</option>)}
              </select>
            </div>

            {/* Cuenta Origen (gasto + transferencia) */}
            {(form.tipo === "gasto" || form.tipo === "transferencia") && (
              <div>
                <Label className="text-[10px] text-slate-500">
                  {form.tipo === "gasto" ? "Cuenta (de dónde sale)" : "Cuenta origen"}
                </Label>
                <select title="Cuenta origen" className={selectCls}
                  value={form.cuentaOrigen ?? ""} onChange={e => setForm(f => ({ ...f, cuentaOrigen: e.target.value || null }))}>
                  <option value="">— Seleccionar —</option>
                  {cuentas.filter(c => c.activa).map(c => <option key={c.documentId} value={c.documentId}>{c.nombre}</option>)}
                </select>
              </div>
            )}

            {/* Cuenta Destino (ingreso + transferencia) */}
            {(form.tipo === "ingreso" || form.tipo === "transferencia") && (
              <div>
                <Label className="text-[10px] text-slate-500">
                  {form.tipo === "ingreso" ? "Cuenta (a dónde llega)" : "Cuenta destino"}
                </Label>
                <select title="Cuenta destino" className={selectCls}
                  value={form.cuentaDestino ?? ""} onChange={e => setForm(f => ({ ...f, cuentaDestino: e.target.value || null }))}>
                  <option value="">— Seleccionar —</option>
                  {cuentas.filter(c => c.activa).map(c => <option key={c.documentId} value={c.documentId}>{c.nombre}</option>)}
                </select>
              </div>
            )}

            <div className="col-span-2">
              <Label className="text-[10px] text-slate-500">Notas (opcional)</Label>
              <textarea className="w-full text-sm border border-slate-700 rounded-lg px-3 py-2 bg-slate-800 text-slate-200 resize-none"
                rows={2} placeholder="Detalles adicionales..."
                value={form.notas ?? ""} onChange={e => setForm(f => ({ ...f, notas: e.target.value || null }))} />
            </div>
          </div>

          <Button className="mt-4 w-full bg-cyan-600 hover:bg-cyan-700" size="sm" onClick={handleGuardar} disabled={guardando}>
            {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Registrar transacción"}
          </Button>
        </motion.div>
      )}

      {/* ── Lista de transacciones ─────────────────────────────────────── */}
      {filtradas.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-slate-600">{hayFiltros ? "Sin resultados con estos filtros" : "Sin transacciones. Registra tu primera."}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtradas.map((tx, i) => {
            const cfg = TIPO_CONFIG[tx.tipo]
            const Icon = cfg.icon
            return (
              <motion.div
                key={tx.documentId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-700/40 backdrop-blur-sm hover:border-slate-600/50 transition-colors"
              >
                {/* Icono tipo */}
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${cfg.bg} ${cfg.border} border shrink-0`}>
                  <Icon className={`h-4 w-4 ${cfg.color}`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-200 truncate">{tx.descripcion}</p>
                    {tx.categoria && (
                      <span className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded hidden sm:inline">
                        {tx.categoria}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-600">
                    <span>{fmtFecha(tx.fecha)}</span>
                    {tx.cuentaOrigen && <span>de {tx.cuentaOrigen.nombre}</span>}
                    {tx.tipo === "transferencia" && tx.cuentaDestino && <span>→ {tx.cuentaDestino.nombre}</span>}
                    {tx.tipo === "ingreso" && tx.cuentaDestino && <span>a {tx.cuentaDestino.nombre}</span>}
                  </div>
                </div>

                {/* Monto */}
                <p className={`text-sm font-bold tabular-nums shrink-0 ${
                  tx.tipo === "ingreso" ? "text-emerald-400" :
                  tx.tipo === "gasto"   ? "text-red-400" :
                  "text-cyan-400"
                }`}>
                  {tx.tipo === "gasto" ? "-" : tx.tipo === "ingreso" ? "+" : ""}{fmt(tx.monto)}
                </p>

                {/* Acciones */}
                <div className="flex gap-0.5 shrink-0">
                  <button type="button" title="Editar" onClick={() => abrirEditar(tx)}
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-600 hover:text-slate-300 transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button type="button" title="Eliminar" onClick={() => handleEliminar(tx)}
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ── Total filtrado ─────────────────────────────────────────────── */}
      {filtradas.length > 0 && (
        <div className="flex justify-between items-center text-[10px] text-slate-600 px-1">
          <span>{filtradas.length} transaccion{filtradas.length !== 1 ? "es" : ""}</span>
          <span>
            Total mostrado: <span className="text-slate-400 font-semibold">
              {fmt(filtradas.reduce((s, tx) => {
                if (tx.tipo === "ingreso") return s + Number(tx.monto)
                if (tx.tipo === "gasto") return s - Number(tx.monto)
                return s
              }, 0))}
            </span>
          </span>
        </div>
      )}
    </div>
  )
}
