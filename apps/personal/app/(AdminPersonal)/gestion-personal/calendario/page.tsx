"use client"
import { useState, useMemo } from "react"
import { useGetEventos } from "@/api/evento-calendario/getEventos"
import { createEvento } from "@/api/evento-calendario/createEvento"
import { deleteEvento } from "@/api/evento-calendario/deleteEvento"
import { createTransaccion } from "@/api/transaccion/createTransaccion"
import { deleteTransaccion } from "@/api/transaccion/deleteTransaccion"
import { useGetTransacciones } from "@/api/transaccion/getTransacciones"
import { useGetCuentas } from "@/api/cuenta/getCuentas"
import { EventoCalendarioType, EventoCalendarioPayload, EventoTipo } from "@/types/evento-calendario"
import { TipoTransaccion } from "@/types/transaccion"
import { useGetCategorias } from "@/api/categoria/getCategorias"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

// Normalize para detectar transferencias (ahorro/inversión) por nombre de categoría
const normCat = (s: string | null | undefined) =>
  (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim()

export default function CalendarioPage() {
  const { eventos, setEventos } = useGetEventos()
  const { transacciones, setTransacciones } = useGetTransacciones()
  const { cuentas } = useGetCuentas()
  const { categorias } = useGetCategorias()
  const categoriasActivas = categorias.filter(c => c.activa)
  const categoriasEgreso  = categoriasActivas.filter(c => c.tipo === "gasto")
  const categoriasIngreso = categoriasActivas.filter(c => c.tipo === "ingreso")
  const [mesActual, setMesActual] = useState(new Date())
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null)
  const [modalAgregar, setModalAgregar] = useState(false)
  const [form, setForm] = useState<EventoCalendarioPayload>({
    titulo: "", monto: 0, tipo: "pago", tipoPago: null, cuenta: null, fecha: "", descripcion: "", recurrente: false, categoria: null,
  })
  const [guardando, setGuardando] = useState(false)
  const [cuentaDestino, setCuentaDestino] = useState<string | null>(null)

  // Categorías que son transferencias (mueven dinero a otra cuenta, no son gasto)
  // Detecta por grupo "ahorro" en la tabla Categorias
  const catGrupoForm = categorias.find(c => normCat(c.nombre) === normCat(form.categoria))?.grupo
  const esTransferencia = form.tipo === "pago" && catGrupoForm === "ahorro"

  const diasDelMes = eachDayOfInterval({ start: startOfMonth(mesActual), end: endOfMonth(mesActual) })
  const primerDia = getDay(startOfMonth(mesActual))

  const eventosDelDia = (dia: Date) => eventos.filter(e => isSameDay(new Date(e.fecha + "T00:00:00"), dia))

  // Transacciones que NO vinieron del calendario (sin evento que coincida)
  const txSueltas = (dia: Date) => {
    const diaStr = format(dia, "yyyy-MM-dd")
    return transacciones.filter(tx => {
      if (!tx.fecha) return false
      if (tx.fecha.slice(0, 10) !== diaStr) return false
      // Excluir si hay un evento que coincide (fue creada desde calendario)
      const tieneEvento = eventos.some(ev =>
        ev.titulo === tx.descripcion &&
        Number(ev.monto) === Number(tx.monto) &&
        ev.fecha === diaStr
      )
      return !tieneEvento
    })
  }

  // Totales del mes: transacciones + eventos sin tx asociada (deduplicado por fecha+monto)
  // Mismo criterio que HUD y Presupuesto — calendario también funciona como registro de transacciones.
  const mesKey = `${mesActual.getFullYear()}-${String(mesActual.getMonth() + 1).padStart(2, "0")}`
  const txDelMes = transacciones.filter(tx => tx.fecha?.slice(0, 7) === mesKey)
  const evDelMes = eventos.filter(e => e.fecha?.slice(0, 7) === mesKey)
  const txHuellas = new Set(txDelMes.map(tx => `${tx.fecha.slice(0, 10)}_${Number(tx.monto)}`))

  const totalIngresos =
    txDelMes.filter(tx => tx.tipo === "ingreso").reduce((s, tx) => s + Number(tx.monto), 0) +
    evDelMes.filter(e => e.tipo === "ingreso" && !txHuellas.has(`${e.fecha.slice(0, 10)}_${Number(e.monto)}`))
      .reduce((s, e) => s + Number(e.monto), 0)

  const totalPagos =
    txDelMes.filter(tx => tx.tipo === "gasto").reduce((s, tx) => s + Number(tx.monto), 0) +
    evDelMes.filter(e => e.tipo === "pago" && !txHuellas.has(`${e.fecha.slice(0, 10)}_${Number(e.monto)}`))
      .reduce((s, e) => s + Number(e.monto), 0)

  const handleDiaClick = (dia: Date) => {
    setDiaSeleccionado(dia)
    setModalAgregar(false)
  }

  const handleAbrirFormulario = () => {
    setForm({ titulo: "", monto: 0, tipo: "pago", tipoPago: null, cuenta: null, fecha: diaSeleccionado ? format(diaSeleccionado, "yyyy-MM-dd") : "", descripcion: "", recurrente: false, categoria: null })
    setCuentaDestino(null)
    setModalAgregar(true)
  }

  const handleGuardar = async () => {
    if (!form.titulo || !form.fecha || !form.monto) return

    // ── Bloquear evento duplicado (mismo título + fecha + monto) ──────────
    const eventoYaExiste = eventos.some(ev =>
      ev.titulo === form.titulo &&
      ev.fecha  === form.fecha &&
      Number(ev.monto) === Number(form.monto)
    )
    if (eventoYaExiste) {
      toast.error("Ya existe un evento con el mismo título, fecha y monto. Revisa si ya lo registraste.")
      return
    }

    // ── Si tiene cuenta, bloquear si ya hay transacción ese día por ese monto ─
    if (form.cuenta) {
      const txYaExiste = transacciones.some(tx =>
        tx.fecha?.slice(0, 10) === form.fecha &&
        Number(tx.monto) === Number(form.monto) &&
        (tx.cuentaOrigen?.documentId === form.cuenta || tx.cuentaDestino?.documentId === form.cuenta)
      )
      if (txYaExiste) {
        toast.error(`Ya existe una transacción de $${form.monto} en esa cuenta el ${form.fecha}. Revisa Transacciones para evitar duplicados.`)
        return
      }
    }

    setGuardando(true)

    // 1. Crear el evento en calendario
    let eventoCreado = false
    try {
      const nuevo = await createEvento(form)
      setEventos(prev => [...prev, nuevo])
      setModalAgregar(false)
      eventoCreado = true
    } catch (e: any) {
      console.error("[calendario] error creando evento:", e)
      toast.error(`Error al guardar evento: ${e?.message ?? "desconocido"}`)
      setGuardando(false)
      return
    }

    // 2. Crear transacción automáticamente si tiene cuenta — aislado
    if (form.cuenta) {
      try {
        const catTx = form.categoria ?? "Otro"
        let tipoTx: TipoTransaccion
        let origen: string | null = null
        let destino: string | null = null

        if (form.tipo === "ingreso") {
          tipoTx = "ingreso"
          destino = form.cuenta
        } else if (esTransferencia && cuentaDestino) {
          tipoTx = "transferencia"
          origen = form.cuenta
          destino = cuentaDestino
        } else {
          tipoTx = "gasto"
          origen = form.cuenta
        }

        const txPayload = {
          descripcion: form.titulo,
          tipo: tipoTx,
          monto: form.monto,
          fecha: new Date(form.fecha).toISOString(),
          categoria: catTx,
          notas: form.descripcion || `Desde calendario`,
          cuentaOrigen: origen,
          cuentaDestino: destino,
        }

        const txNueva = await createTransaccion(txPayload)
        setTransacciones(prev => [txNueva, ...prev])
        toast.success("Evento + transacción creados")
      } catch (e: any) {
        console.error("[calendario] evento creado pero falló la transacción:", e)
        toast.error(`Evento guardado, pero falló crear transacción: ${e?.message ?? "desconocido"}`)
      }
    } else if (eventoCreado) {
      toast.success("Evento guardado (sin cuenta, no se creó transacción)")
    }

    setGuardando(false)
  }

  const handleEliminar = async (evento: EventoCalendarioType) => {
    try {
      await deleteEvento(evento.documentId)
      setEventos(prev => prev.filter(e => e.documentId !== evento.documentId))

      // Buscar y eliminar transacción asociada (misma descripción, monto y fecha)
      const txAsociada = transacciones.find(tx =>
        tx.descripcion === evento.titulo &&
        Number(tx.monto) === evento.monto &&
        tx.fecha.slice(0, 10) === evento.fecha
      )
      if (txAsociada) {
        await deleteTransaccion(txAsociada.documentId)
        setTransacciones(prev => prev.filter(t => t.documentId !== txAsociada.documentId))
      }

      toast.success("Evento eliminado" + (txAsociada ? " y transacción revertida" : ""))
    } catch (e) {
      console.error(e)
      toast.error("Error al eliminar")
    }
  }

  // ── Eventos huérfanos: tienen cuenta pero NO existe tx con mismo titulo+fecha+monto
  const huerfanos = useMemo(() => {
    return eventos.filter(ev => {
      if (!ev.cuenta) return false
      return !transacciones.some(tx =>
        tx.descripcion === ev.titulo &&
        tx.fecha?.slice(0, 10) === ev.fecha &&
        Number(tx.monto) === Number(ev.monto)
      )
    })
  }, [eventos, transacciones])

  const repararHuerfanos = async () => {
    if (huerfanos.length === 0) { toast.success("No hay eventos huérfanos"); return }
    if (!confirm(`Crear ${huerfanos.length} transacción(es) faltante(s) desde eventos del calendario?`)) return
    let creadas = 0; let fallidas = 0; let omitidas = 0
    for (const ev of huerfanos) {
      try {
        // Verificar de nuevo justo antes de crear para evitar duplicados
        const yaExiste = transacciones.some(tx =>
          tx.descripcion === ev.titulo &&
          tx.fecha?.slice(0, 10) === ev.fecha &&
          Number(tx.monto) === Number(ev.monto)
        )
        if (yaExiste) { omitidas++; continue }

        const cat = ev.categoria ?? "Otro"
        const cuentaDocId = ev.cuenta!.documentId
        let tipoTx: TipoTransaccion = "gasto"
        let origen: string | null = null
        let destino: string | null = null
        if (ev.tipo === "ingreso") { tipoTx = "ingreso"; destino = cuentaDocId }
        else                       { tipoTx = "gasto";   origen  = cuentaDocId }
        const tx = await createTransaccion({
          descripcion:  ev.titulo,
          tipo:         tipoTx,
          monto:        Number(ev.monto),
          fecha:        new Date(ev.fecha + "T05:00:00").toISOString(),
          categoria:    cat,
          notas:        ev.descripcion || "Reparado desde calendario",
          cuentaOrigen:  origen,
          cuentaDestino: destino,
        })
        setTransacciones(prev => [tx, ...prev])
        creadas++
      } catch (e) {
        console.error("[reparar] falló evento", ev.titulo, e)
        fallidas++
      }
    }
    toast.success(`Reparado: ${creadas} creada(s)${omitidas > 0 ? `, ${omitidas} ya existían` : ""}${fallidas > 0 ? `, ${fallidas} fallaron` : ""}`)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Aviso de huérfanos */}
      {huerfanos.length > 0 && (
        <div className="mb-4 p-3 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between gap-3">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            ⚠️ {huerfanos.length} evento(s) con cuenta asociada no tienen transacción registrada.
          </p>
          <Button size="sm" variant="outline" onClick={repararHuerfanos}>
            Crear transacciones faltantes
          </Button>
        </div>
      )}

      {/* RESUMEN DEL MES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">Ingresos del mes</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">${totalIngresos.toLocaleString()}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">Pagos del mes</p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">${totalPagos.toLocaleString()}</p>
        </div>
        <div className={`rounded-xl p-4 border ${totalIngresos - totalPagos >= 0
          ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800"
          : "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800"}`}>
          <p className={`text-sm font-medium ${totalIngresos - totalPagos >= 0 ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-400"}`}>Balance</p>
          <p className={`text-2xl font-bold ${totalIngresos - totalPagos >= 0 ? "text-blue-700 dark:text-blue-300" : "text-orange-700 dark:text-orange-300"}`}>
            ${(totalIngresos - totalPagos).toLocaleString()}
          </p>
        </div>
      </div>

      {/* CARTERA */}
      {cuentas.filter(c => c.activa).length > 0 && (
        <div className="mb-6 bg-white dark:bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={16} className="text-muted-foreground" />
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Cartera</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {cuentas.filter(c => c.activa).map(c => {
              const saldo = c.saldoActual ?? c.saldoInicial ?? 0
              const esCredito = c.tipo === "Crédito"
              const positivo = esCredito ? saldo === 0 : saldo >= 0
              return (
                <div key={c.id} className={`flex-1 min-w-[140px] rounded-lg border px-3 py-2 ${positivo
                  ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/40"
                  : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40"}`}>
                  <p className="text-xs text-muted-foreground truncate">{c.nombre}</p>
                  <p className={`text-sm font-bold ${positivo ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                    {esCredito ? "Deuda: " : ""}{saldo < 0 ? "-" : ""}${Math.abs(saldo).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{c.proposito ?? c.tipo}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* CALENDARIO */}
        <div className="lg:col-span-2 bg-white dark:bg-card border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <button type="button" title="Mes anterior" onClick={() => setMesActual(m => new Date(m.getFullYear(), m.getMonth() - 1))} className="p-1 hover:bg-muted rounded">
              <ChevronLeft size={20} />
            </button>
            <h2 className="font-bold text-lg capitalize">
              {format(mesActual, "MMMM yyyy", { locale: es })}
            </h2>
            <button type="button" title="Mes siguiente" onClick={() => setMesActual(m => new Date(m.getFullYear(), m.getMonth() + 1))} className="p-1 hover:bg-muted rounded">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DIAS.map(d => <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: primerDia }).map((_, i) => <div key={`empty-${i}`} />)}
            {diasDelMes.map(dia => {
              const evs = eventosDelDia(dia)
              const seleccionado = diaSeleccionado && isSameDay(dia, diaSeleccionado)
              return (
                <button
                  type="button"
                  title={format(dia, "d 'de' MMMM", { locale: es })}
                  key={dia.toISOString()}
                  onClick={() => handleDiaClick(dia)}
                  className={`relative min-h-[56px] p-1 rounded-lg text-left transition-all border
                    ${seleccionado ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40" : "border-transparent hover:bg-muted"}
                    ${isToday(dia) ? "font-bold" : ""}
                  `}
                >
                  <span className={`text-xs ${isToday(dia) ? "bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center" : "text-foreground"}`}>
                    {format(dia, "d")}
                  </span>
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    {evs.slice(0, 2).map(e => (
                      <div key={e.id} className={`text-[10px] rounded px-1 truncate ${e.tipo === "ingreso"
                        ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                        : "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"}`}>
                        {e.titulo}
                      </div>
                    ))}
                    {txSueltas(dia).slice(0, evs.length >= 2 ? 0 : 2 - evs.length).map(tx => (
                      <div key={`tx-${tx.id}`} className={`text-[10px] rounded px-1 truncate border border-dashed ${
                        tx.tipo === "ingreso" ? "border-green-400 text-green-600 dark:text-green-400"
                        : tx.tipo === "transferencia" ? "border-amber-400 text-amber-600 dark:text-amber-400"
                        : "border-red-400 text-red-600 dark:text-red-400"}`}>
                        {tx.descripcion}
                      </div>
                    ))}
                    {(evs.length + txSueltas(dia).length) > 2 && <div className="text-[10px] text-muted-foreground">+{evs.length + txSueltas(dia).length - 2} más</div>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* PANEL LATERAL */}
        <div className="bg-white dark:bg-card border rounded-xl p-4">
          {diaSeleccionado ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold capitalize">
                  {format(diaSeleccionado, "d 'de' MMMM", { locale: es })}
                </h3>
                <Button type="button" size="sm" onClick={handleAbrirFormulario}>
                  <Plus size={14} className="mr-1" /> Agregar
                </Button>
              </div>

              {modalAgregar && (
                <div className="mb-4 p-3 bg-muted rounded-lg border space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">Nuevo evento</p>
                    <button type="button" title="Cerrar" onClick={() => setModalAgregar(false)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
                  </div>
                  <div>
                    <Label className="text-xs">Título</Label>
                    <Input className="h-7 text-sm" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ej: Renta" />
                  </div>
                  <div>
                    <Label className="text-xs">Monto</Label>
                    <Input className="h-7 text-sm" type="number" placeholder="0" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Tipo</Label>
                    <select title="Tipo de evento" className="w-full h-7 text-sm border rounded px-2 bg-background text-foreground" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as EventoTipo, categoria: e.target.value === "ingreso" ? "ingreso" : f.categoria }))}>
                      <option value="pago">Pago</option>
                      <option value="ingreso">Ingreso</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Categoría</Label>
                    <select
                      title="Categoría del evento"
                      className="w-full h-7 text-sm border rounded px-2 bg-background text-foreground"
                      value={form.categoria ?? ""}
                      onChange={e => setForm(f => ({ ...f, categoria: e.target.value || null }))}
                    >
                      <option value="">— Sin categoría —</option>
                      {(form.tipo === "ingreso" ? categoriasIngreso : categoriasEgreso).map(c => (
                        <option key={c.documentId} value={c.nombre}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">{esTransferencia ? "Cuenta origen" : "Cuenta"} <span className="text-cyan-500">→ crea transacción</span></Label>
                    <select
                      title="Cuenta"
                      className="w-full h-7 text-sm border rounded px-2 bg-background text-foreground"
                      value={form.cuenta ?? ""}
                      onChange={e => setForm(f => ({ ...f, cuenta: e.target.value || null }))}
                    >
                      <option value="">— Sin cuenta —</option>
                      {cuentas.filter(c => c.activa).map(c => (
                        <option key={c.documentId} value={c.documentId}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  {/* Cuenta destino para transferencias (ahorro/inversión) */}
                  {esTransferencia && form.cuenta && (
                    <div>
                      <Label className="text-xs">Cuenta destino <span className="text-amber-500">→ transferencia</span></Label>
                      <select
                        title="Cuenta destino"
                        className="w-full h-7 text-sm border rounded px-2 bg-background text-foreground"
                        value={cuentaDestino ?? ""}
                        onChange={e => setCuentaDestino(e.target.value || null)}
                      >
                        <option value="">— Seleccionar destino —</option>
                        {cuentas.filter(c => c.activa && c.documentId !== form.cuenta).map(c => (
                          <option key={c.documentId} value={c.documentId}>{c.nombre}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs">Descripción (opcional)</Label>
                    <Input className="h-7 text-sm" placeholder="Notas..." value={form.descripcion ?? ""} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="recurrente" title="Recurrente mensual" checked={form.recurrente} onChange={e => setForm(f => ({ ...f, recurrente: e.target.checked }))} />
                    <Label htmlFor="recurrente" className="text-xs">Recurrente mensual</Label>
                  </div>
                  <Button type="button" size="sm" className="w-full" onClick={handleGuardar} disabled={guardando}>
                    {guardando ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                {eventosDelDia(diaSeleccionado).length === 0 && txSueltas(diaSeleccionado).length === 0 && !modalAgregar && (
                  <p className="text-sm text-muted-foreground text-center py-4">Sin eventos este día</p>
                )}
                {eventosDelDia(diaSeleccionado).map(evento => (
                  <div key={evento.id} className={`flex items-center justify-between p-2 rounded-lg border ${evento.tipo === "ingreso"
                    ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/40"
                    : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40"}`}>
                    <div>
                      <p className="text-sm font-medium">{evento.titulo}</p>
                      <p className={`text-xs font-bold ${evento.tipo === "ingreso" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {evento.tipo === "ingreso" ? "+" : "-"}${evento.monto.toLocaleString()}
                      </p>
                      {evento.cuenta && <p className="text-xs text-purple-500">{evento.cuenta.nombre}</p>}
                      {evento.categoria && <p className="text-xs text-indigo-500 capitalize">{evento.categoria}</p>}
                      {evento.descripcion && <p className="text-xs text-muted-foreground">{evento.descripcion}</p>}
                    </div>
                    <button type="button" title="Eliminar evento" onClick={() => handleEliminar(evento)} className="text-muted-foreground hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {/* Transacciones creadas fuera del calendario */}
                {txSueltas(diaSeleccionado).map(tx => (
                  <div key={`tx-${tx.id}`} className={`flex items-center justify-between p-2 rounded-lg border border-dashed ${
                    tx.tipo === "ingreso" ? "border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/20"
                    : tx.tipo === "transferencia" ? "border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20"
                    : "border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20"}`}>
                    <div>
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-medium">{tx.descripcion}</p>
                        <span className="text-[9px] bg-muted text-muted-foreground rounded px-1">tx</span>
                      </div>
                      <p className={`text-xs font-bold ${
                        tx.tipo === "ingreso" ? "text-green-600 dark:text-green-400"
                        : tx.tipo === "transferencia" ? "text-amber-600 dark:text-amber-400"
                        : "text-red-600 dark:text-red-400"}`}>
                        {tx.tipo === "ingreso" ? "+" : tx.tipo === "transferencia" ? "↔" : "-"}${Number(tx.monto).toLocaleString()}
                      </p>
                      {tx.cuentaOrigen && <p className="text-xs text-purple-500">{tx.cuentaOrigen.nombre}{tx.cuentaDestino ? ` → ${tx.cuentaDestino.nombre}` : ""}</p>}
                      {!tx.cuentaOrigen && tx.cuentaDestino && <p className="text-xs text-purple-500">{tx.cuentaDestino.nombre}</p>}
                      {tx.categoria && <p className="text-xs text-indigo-500 capitalize">{tx.categoria}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Selecciona un día para ver o agregar eventos</p>
          )}
        </div>
      </div>
    </div>
  )
}
