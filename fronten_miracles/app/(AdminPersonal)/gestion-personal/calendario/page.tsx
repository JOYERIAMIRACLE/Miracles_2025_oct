"use client"
import { useState, useEffect } from "react"
import { useGetEventos } from "@/api/evento-calendario/getEventos"
import { createEvento } from "@/api/evento-calendario/createEvento"
import { deleteEvento } from "@/api/evento-calendario/deleteEvento"
import { createRegistro } from "@/api/registro-mensual/createRegistro"
import { updateRegistro } from "@/api/registro-mensual/updateRegistro"
import { useGetRegistros } from "@/api/registro-mensual/getRegistros"
import { EventoCalendarioType, EventoCalendarioPayload, EventoTipo, CategoriaEvento } from "@/types/evento-calendario"
import { RegistroMensualType } from "@/types/registro-mensual"
import { CategoriaPresupuesto } from "@/types/partida-presupuesto"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

const CATEGORIAS_EGRESO: CategoriaEvento[] = [
  "vivienda", "alimentación", "transporte", "servicios",
  "gastos_personales", "entretenimiento", "salud", "ropa",
  "educación", "ahorro", "inversión",
]

export default function CalendarioPage() {
  const { eventos, setEventos } = useGetEventos()
  const { registros, setRegistros } = useGetRegistros()
  const [mesActual, setMesActual] = useState(new Date())
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null)
  const [modalAgregar, setModalAgregar] = useState(false)
  const [form, setForm] = useState<EventoCalendarioPayload>({
    titulo: "", monto: 0, tipo: "pago", fecha: "", descripcion: "", recurrente: false, categoria: null,
  })
  const [guardando, setGuardando] = useState(false)

  const diasDelMes = eachDayOfInterval({ start: startOfMonth(mesActual), end: endOfMonth(mesActual) })
  const primerDia = getDay(startOfMonth(mesActual))

  const eventosDelDia = (dia: Date) => eventos.filter(e => isSameDay(new Date(e.fecha + "T00:00:00"), dia))

  const totalIngresos = eventos
    .filter(e => e.tipo === "ingreso" && new Date(e.fecha).getMonth() === mesActual.getMonth() && new Date(e.fecha).getFullYear() === mesActual.getFullYear())
    .reduce((acc, e) => acc + e.monto, 0)

  const totalPagos = eventos
    .filter(e => e.tipo === "pago" && new Date(e.fecha).getMonth() === mesActual.getMonth() && new Date(e.fecha).getFullYear() === mesActual.getFullYear())
    .reduce((acc, e) => acc + e.monto, 0)

  const handleDiaClick = (dia: Date) => {
    setDiaSeleccionado(dia)
    setModalAgregar(false)
  }

  const handleAbrirFormulario = () => {
    setForm({ titulo: "", monto: 0, tipo: "pago", fecha: diaSeleccionado ? format(diaSeleccionado, "yyyy-MM-dd") : "", descripcion: "", recurrente: false, categoria: null })
    setModalAgregar(true)
  }

  // Sincroniza el registro mensual de una categoría sumando todos los eventos del mes
  const sincronizarRegistro = async (categoria: CategoriaEvento, mes: number, anio: number, eventosActuales: EventoCalendarioType[]) => {
    const totalCategoria = eventosActuales
      .filter(e => e.categoria === categoria && new Date(e.fecha).getMonth() + 1 === mes && new Date(e.fecha).getFullYear() === anio)
      .reduce((acc, e) => acc + e.monto, 0)

    const esIngreso = categoria === "ingreso"
    const registroExistente = registros.find(r => r.categoria === categoria && r.mes === mes && r.anio === anio)

    const payload = {
      descripcion: `${categoria} — calendario`,
      tipo: esIngreso ? "ingreso_variable" as const : "gasto_extra" as const,
      monto: totalCategoria,
      mes,
      anio,
      categoria: categoria as CategoriaPresupuesto,
      notas: "Sincronizado desde calendario",
    }

    let saved: RegistroMensualType
    if (registroExistente) {
      saved = await updateRegistro(registroExistente.documentId, payload)
      setRegistros(prev => prev.map(r => r.documentId === saved.documentId ? saved : r))
    } else {
      saved = await createRegistro(payload)
      setRegistros(prev => [...prev, saved])
    }
  }

  const handleGuardar = async () => {
    if (!form.titulo || !form.fecha || !form.monto) return
    setGuardando(true)
    try {
      const nuevo = await createEvento(form)
      const eventosActualizados = [...eventos, nuevo]
      setEventos(eventosActualizados)
      setModalAgregar(false)

      // Si tiene categoría, sincroniza el registro mensual
      if (form.categoria) {
        const fechaEvento = new Date(form.fecha)
        await sincronizarRegistro(form.categoria, fechaEvento.getMonth() + 1, fechaEvento.getFullYear(), eventosActualizados)
        toast.success("Evento guardado y registro mensual actualizado")
      } else {
        toast.success("Evento guardado")
      }
    } catch (e) {
      console.error(e)
      toast.error("Error al guardar")
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminar = async (evento: EventoCalendarioType) => {
    try {
      await deleteEvento(evento.documentId)
      const eventosActualizados = eventos.filter(e => e.documentId !== evento.documentId)
      setEventos(eventosActualizados)

      // Si tenía categoría, re-sincroniza el registro mensual
      if (evento.categoria) {
        const fechaEvento = new Date(evento.fecha)
        await sincronizarRegistro(evento.categoria, fechaEvento.getMonth() + 1, fechaEvento.getFullYear(), eventosActualizados)
        toast.success("Evento eliminado y registro mensual actualizado")
      } else {
        toast.success("Evento eliminado")
      }
    } catch (e) {
      console.error(e)
      toast.error("Error al eliminar")
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* RESUMEN DEL MES */}
      <div className="grid grid-cols-3 gap-4 mb-6">
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
                    {evs.length > 2 && <div className="text-[10px] text-muted-foreground">+{evs.length - 2} más</div>}
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
                    <Label className="text-xs">Categoría {form.categoria && <span className="text-indigo-500">→ sincroniza registro mensual</span>}</Label>
                    <select
                      title="Categoría del evento"
                      className="w-full h-7 text-sm border rounded px-2 bg-background text-foreground"
                      value={form.categoria ?? ""}
                      onChange={e => setForm(f => ({ ...f, categoria: (e.target.value || null) as CategoriaEvento | null }))}
                    >
                      <option value="">— Sin categoría —</option>
                      {form.tipo === "ingreso"
                        ? <option value="ingreso">Ingreso</option>
                        : CATEGORIAS_EGRESO.map(c => <option key={c} value={c}>{c}</option>)
                      }
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Descripción (opcional)</Label>
                    <Input className="h-7 text-sm" placeholder="Notas..." value={form.descripcion ?? ""} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="recurrente" checked={form.recurrente} onChange={e => setForm(f => ({ ...f, recurrente: e.target.checked }))} />
                    <Label htmlFor="recurrente" className="text-xs">Recurrente mensual</Label>
                  </div>
                  <Button type="button" size="sm" className="w-full" onClick={handleGuardar} disabled={guardando}>
                    {guardando ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                {eventosDelDia(diaSeleccionado).length === 0 && !modalAgregar && (
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
                      {evento.categoria && <p className="text-xs text-indigo-500 capitalize">{evento.categoria}</p>}
                      {evento.descripcion && <p className="text-xs text-muted-foreground">{evento.descripcion}</p>}
                    </div>
                    <button type="button" title="Eliminar evento" onClick={() => handleEliminar(evento)} className="text-muted-foreground hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
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
