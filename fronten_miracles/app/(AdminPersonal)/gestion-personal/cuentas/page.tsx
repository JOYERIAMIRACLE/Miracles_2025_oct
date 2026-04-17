"use client"
import { useState, useMemo } from "react"
import { useGetCuentas } from "@/api/cuenta/getCuentas"
import { useGetTransacciones } from "@/api/transaccion/getTransacciones"
import { createCuenta } from "@/api/cuenta/createCuenta"
import { updateCuenta } from "@/api/cuenta/updateCuenta"
import { deleteCuenta } from "@/api/cuenta/deleteCuenta"
import { CuentaType, CuentaPayload, TipoCuenta, PropositoCuenta } from "@/types/cuenta"
import { Plus, Pencil, Trash2, X, Check, Banknote, TrendingUp, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InventarioNav } from "@/components/Personal/InventarioNav"
import { toast } from "sonner"

const TIPOS: TipoCuenta[]    = ["Efectivo", "Crédito", "Debito"]
const PROPOSITOS: PropositoCuenta[] = ["Operativa", "Ahorro", "Inversión", "Apartado", "Presupuesto 1"]

const fmt = (n: number | null | undefined) =>
  `$${(n ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`

const COLORES = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#14b8a6", "#f97316"]

const inputCls = "h-8 text-sm"

const emptyForm = (): CuentaPayload => ({
  nombre: "",
  tipo: null,
  proposito: null,
  saldoInicial: 0,
  saldoActual: null,
  saldoBanco: null,
  metaDeCuenta: null,
  color: COLORES[0],
  activa: true,
})

export default function CuentasPage() {
  const { cuentas, setCuentas, loading } = useGetCuentas()
  const { transacciones } = useGetTransacciones()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState<CuentaPayload>(emptyForm())
  const [editando, setEditando] = useState<CuentaType | null>(null)
  const [guardando, setGuardando] = useState(false)

  const activas = cuentas.filter(c => c.activa)
  const liquidas = activas.filter(c => c.tipo !== "Crédito")
  const creditos = activas.filter(c => c.tipo === "Crédito")
  const efectivo = activas.filter(c => c.tipo === "Efectivo")

  const totalSistema  = liquidas.reduce((s, c) => s + (c.saldoActual ?? c.saldoInicial ?? 0), 0)
  const totalEfectivo = efectivo.reduce((s, c) => s + (c.saldoActual ?? c.saldoInicial ?? 0), 0)
  const totalBanco    = liquidas.filter(c => c.saldoBanco != null).reduce((s, c) => s + c.saldoBanco!, 0)
  const tieneBancos   = liquidas.some(c => c.saldoBanco != null)
  const totalDeuda    = creditos.reduce((s, c) => s + (c.saldoActual ?? c.saldoInicial ?? 0), 0)
  const diferencia    = tieneBancos ? totalBanco - totalSistema : null

  // ─── Resumen mensual: transacciones registradas por mes ───
  const resumenMensual = useMemo(() => {
    const hoy = new Date()
    const meses: { key: string; label: string; ingresos: number; gastos: number }[] = []
    for (let i = 0; i < 6; i++) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const label = d.toLocaleDateString("es-MX", { month: "short", year: "numeric" })
      const txMes = transacciones.filter(t => t.fecha?.startsWith(key))
      const ingresos = txMes.filter(t => t.tipo === "ingreso").reduce((s, t) => s + Number(t.monto), 0)
      const gastos   = txMes.filter(t => t.tipo === "gasto").reduce((s, t) => s + Number(t.monto), 0)
      meses.push({ key, label, ingresos, gastos })
    }
    return meses
  }, [transacciones])

  const abrirCrear = () => {
    setEditando(null)
    setForm(emptyForm())
    setMostrarForm(true)
  }

  const abrirEditar = (c: CuentaType) => {
    setEditando(c)
    setForm({
      nombre:       c.nombre,
      tipo:         c.tipo,
      proposito:    c.proposito,
      saldoInicial: c.saldoInicial ?? 0,
      saldoActual:  c.saldoActual,
      saldoBanco:   c.saldoBanco,
      metaDeCuenta: c.metaDeCuenta,
      color:        c.color,
      activa:       c.activa ?? true,
    })
    setMostrarForm(true)
  }

  const cerrar = () => {
    setMostrarForm(false)
    setEditando(null)
  }

  const handleGuardar = async () => {
    if (!form.nombre) return toast.error("El nombre es obligatorio")
    setGuardando(true)
    try {
      // Si no hay saldoActual seteado, lo igualamos al saldoInicial al crear
      const payload: CuentaPayload = {
        ...form,
        saldoActual: form.saldoActual !== null ? form.saldoActual : form.saldoInicial,
      }
      if (editando) {
        const updated = await updateCuenta(editando.documentId, payload)
        setCuentas(prev => prev.map(c => c.documentId === updated.documentId ? updated : c))
        toast.success("Cuenta actualizada")
      } else {
        const nueva = await createCuenta(payload)
        setCuentas(prev => [...prev, nueva])
        toast.success("Cuenta creada")
      }
      cerrar()
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminar = async (c: CuentaType) => {
    if (!confirm(`¿Eliminar "${c.nombre}"?`)) return
    try {
      await deleteCuenta(c.documentId)
      setCuentas(prev => prev.filter(x => x.documentId !== c.documentId))
      toast.success("Cuenta eliminada")
    } catch (e: any) {
      toast.error(e.message ?? "Error al eliminar")
    }
  }

  const handleToggleActiva = async (c: CuentaType) => {
    try {
      const updated = await updateCuenta(c.documentId, { activa: !c.activa })
      setCuentas(prev => prev.map(x => x.documentId === updated.documentId ? updated : x))
    } catch {
      toast.error("Error al actualizar")
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <InventarioNav />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mis Cuentas</h1>
          <p className="text-sm text-muted-foreground">Gestiona tu cartera y saldos iniciales</p>
        </div>
        <Button onClick={abrirCrear} size="sm">
          <Plus size={14} className="mr-1" /> Nueva cuenta
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {/* Diferencia / faltante (sutil) */}
        <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-muted-foreground font-medium">
            {diferencia === null ? "Sin referencia" : diferencia === 0 ? "Todo cuadra" : diferencia > 0 ? "Sobrante" : "Faltante"}
          </p>
          <p className={`text-xl font-bold ${
            diferencia === null ? "text-zinc-400"
            : diferencia === 0 ? "text-muted-foreground"
            : "text-zinc-700 dark:text-zinc-300"
          }`}>
            {diferencia !== null ? (diferencia >= 0 ? "+" : "") + fmt(diferencia) : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{diferencia !== null && diferencia !== 0 ? "Sin registrar" : ""}</p>
        </div>
        {/* Saldo efectivo */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Efectivo</p>
          <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{fmt(totalEfectivo)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{efectivo.length} cuenta{efectivo.length !== 1 ? "s" : ""} cash</p>
        </div>
        {/* Saldo sistema */}
        <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <p className="text-xs text-green-600 dark:text-green-400 font-medium">Saldo sistema</p>
          <p className="text-xl font-bold text-green-700 dark:text-green-300">{fmt(totalSistema)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Según transacciones</p>
        </div>
        {/* Saldo real banco */}
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Saldo real bancos</p>
          <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{tieneBancos ? fmt(totalBanco) : "—"}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{tieneBancos ? "Lo que dice tu banco" : "Edita cuentas para ingresar"}</p>
        </div>
        {/* Deuda */}
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">Deuda crédito</p>
          <p className="text-xl font-bold text-red-700 dark:text-red-300">{fmt(totalDeuda)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{creditos.length} tarjeta{creditos.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div className="mb-6 bg-white dark:bg-card border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{editando ? "Editar cuenta" : "Nueva cuenta"}</h2>
            <button type="button" title="Cerrar" onClick={cerrar} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">Nombre</Label>
              <Input className={inputCls} placeholder="Ej: BBVA Débito" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Tipo</Label>
              <select
                title="Tipo de cuenta"
                className="w-full h-8 text-sm border rounded px-2 bg-background text-foreground"
                value={form.tipo ?? ""}
                onChange={e => setForm(f => ({ ...f, tipo: (e.target.value || null) as TipoCuenta | null }))}
              >
                <option value="">— Seleccionar —</option>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Propósito</Label>
              <select
                title="Propósito de la cuenta"
                className="w-full h-8 text-sm border rounded px-2 bg-background text-foreground"
                value={form.proposito ?? ""}
                onChange={e => setForm(f => ({ ...f, proposito: (e.target.value || null) as PropositoCuenta | null }))}
              >
                <option value="">— Seleccionar —</option>
                {PROPOSITOS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Saldo inicial</Label>
              <Input className={inputCls} type="number" placeholder="0" value={form.saldoInicial ?? ""} onChange={e => setForm(f => ({ ...f, saldoInicial: Number(e.target.value) }))} />
            </div>
            <div>
              <Label className="text-xs">Saldo real del banco <span className="text-muted-foreground">(referencia)</span></Label>
              <Input className={inputCls} type="number" placeholder="Lo que dice tu banco hoy" value={form.saldoBanco ?? ""} onChange={e => setForm(f => ({ ...f, saldoBanco: e.target.value === "" ? null : Number(e.target.value) }))} />
            </div>
            <div>
              <Label className="text-xs">Meta de la cuenta (opcional)</Label>
              <Input className={inputCls} type="number" placeholder="Ej: 50000" value={form.metaDeCuenta ?? ""} onChange={e => setForm(f => ({ ...f, metaDeCuenta: e.target.value === "" ? null : Number(e.target.value) }))} />
            </div>
            <div>
              <Label className="text-xs">Color</Label>
              <div className="flex gap-2 mt-1">
                {COLORES.map(col => (
                  <button
                    type="button"
                    key={col}
                    title={col}
                    onClick={() => setForm(f => ({ ...f, color: col }))}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${form.color === col ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" id="activa" title="Cuenta activa" checked={form.activa ?? true} onChange={e => setForm(f => ({ ...f, activa: e.target.checked }))} />
              <Label htmlFor="activa" className="text-xs">Cuenta activa</Label>
            </div>
          </div>
          <Button className="mt-4 w-full" size="sm" onClick={handleGuardar} disabled={guardando}>
            {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear cuenta"}
          </Button>
        </div>
      )}

      {/* Lista de cuentas */}
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
      ) : cuentas.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No hay cuentas. Crea una.</p>
      ) : (
        <div className="space-y-3">
          {cuentas.map(c => {
            const saldo = c.saldoActual ?? c.saldoInicial ?? 0
            const esCredito = c.tipo === "Crédito"
            const saldoPositivo = esCredito ? saldo === 0 : saldo >= 0
            const tieneBanco = c.saldoBanco !== null && c.saldoBanco !== undefined
            const diferencia = tieneBanco ? c.saldoBanco! - saldo : null
            return (
              <div key={c.id} className={`flex items-center gap-4 p-4 rounded-xl border bg-white dark:bg-card transition-opacity ${!c.activa ? "opacity-50" : ""}`}>
                {/* Color dot */}
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color ?? "#6366f1" }} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{c.nombre}</p>
                    {!c.activa && <span className="text-[10px] bg-muted text-muted-foreground rounded px-1">Inactiva</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{c.tipo}{c.proposito ? ` · ${c.proposito}` : ""}</p>
                </div>

                {/* Saldo sistema (transacciones) */}
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{esCredito ? "Deuda" : "Sistema"}</p>
                  <p className={`text-sm font-bold ${saldoPositivo ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {fmt(saldo)}
                  </p>
                </div>

                {/* Saldo banco (referencia) */}
                {tieneBanco && (
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground">Banco</p>
                    <p className="text-sm font-semibold">{fmt(c.saldoBanco!)}</p>
                  </div>
                )}

                {/* Diferencia (sutil) */}
                {diferencia !== null && diferencia !== 0 && (
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-muted-foreground">{diferencia > 0 ? "sobrante" : "faltante"}</p>
                    <p className="text-xs text-muted-foreground">
                      {diferencia > 0 ? "+" : ""}{fmt(diferencia)}
                    </p>
                  </div>
                )}
                {diferencia === 0 && tieneBanco && (
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-muted-foreground">✓ cuadra</p>
                  </div>
                )}

                {/* Meta */}
                {c.metaDeCuenta && (
                  <div className="text-right hidden md:block">
                    <p className="text-xs text-muted-foreground">Meta</p>
                    <p className="text-sm">{fmt(c.metaDeCuenta)}</p>
                  </div>
                )}

                {/* Acciones */}
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    title={c.activa ? "Desactivar" : "Activar"}
                    onClick={() => handleToggleActiva(c)}
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    type="button"
                    title="Editar"
                    onClick={() => abrirEditar(c)}
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    title="Eliminar"
                    onClick={() => handleEliminar(c)}
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Resumen mensual: ingresos vs gastos registrados (referencia) */}
      {resumenMensual.some(m => m.ingresos > 0 || m.gastos > 0) && (
        <div className="mt-8 bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 opacity-80">
          <h2 className="font-medium text-xs text-muted-foreground mb-3">Registros mensuales (referencia)</h2>
          <div className="space-y-2">
            {resumenMensual.map(m => {
              const neto = m.ingresos - m.gastos
              const hayData = m.ingresos > 0 || m.gastos > 0
              if (!hayData) return null
              return (
                <div key={m.key} className="flex items-center gap-3 text-sm">
                  <span className="w-20 text-xs text-muted-foreground capitalize">{m.label}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <TrendingUp size={12} className="text-green-500 shrink-0" />
                    <span className="text-green-600 dark:text-green-400 text-xs font-medium w-24">{fmt(m.ingresos)}</span>
                    <TrendingDown size={12} className="text-red-500 shrink-0" />
                    <span className="text-red-600 dark:text-red-400 text-xs font-medium w-24">{fmt(m.gastos)}</span>
                  </div>
                  <span className={`text-xs font-bold w-28 text-right ${neto >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {neto >= 0 ? "+" : ""}{fmt(neto)}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">Últimos 6 meses · Neto = Ingresos − Gastos registrados</p>
        </div>
      )}
    </div>
  )
}
