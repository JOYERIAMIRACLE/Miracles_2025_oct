"use client"
import { useState } from "react"
import { useGetEventos } from "@/api/evento-calendario/getEventos"
import { createEvento } from "@/api/evento-calendario/createEvento"
import { deleteEvento } from "@/api/evento-calendario/deleteEvento"
import { EventoCalendarioType, EventoCalendarioPayload, EventoTipo } from "@/types/evento-calendario"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

export default function CalendarioPage() {
  const { eventos, setEventos, loading } = useGetEventos()
  const [mesActual, setMesActual] = useState(new Date())
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null)
  const [modalAgregar, setModalAgregar] = useState(false)
  const [form, setForm] = useState<EventoCalendarioPayload>({
    titulo: "", monto: 0, tipo: "pago", fecha: "", descripcion: "", recurrente: false,
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
    setForm({ titulo: "", monto: 0, tipo: "pago", fecha: diaSeleccionado ? format(diaSeleccionado, "yyyy-MM-dd") : "", descripcion: "", recurrente: false })
    setModalAgregar(true)
  }

  const handleGuardar = async () => {
    if (!form.titulo || !form.fecha || !form.monto) return
    setGuardando(true)
    try {
      const nuevo = await createEvento(form)
      setEventos(prev => [...prev, nuevo])
      setModalAgregar(false)
    } catch (e) { console.error(e) }
    finally { setGuardando(false) }
  }

  const handleEliminar = async (evento: EventoCalendarioType) => {
    try {
      await deleteEvento(evento.documentId)
      setEventos(prev => prev.filter(e => e.documentId !== evento.documentId))
    } catch (e) { console.error(e) }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* RESUMEN DEL MES */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-600 font-medium">Ingresos del mes</p>
          <p className="text-2xl font-bold text-green-700">${totalIngresos.toLocaleString()}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-600 font-medium">Pagos del mes</p>
          <p className="text-2xl font-bold text-red-700">${totalPagos.toLocaleString()}</p>
        </div>
        <div className={`rounded-xl p-4 border ${totalIngresos - totalPagos >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}`}>
          <p className={`text-sm font-medium ${totalIngresos - totalPagos >= 0 ? "text-blue-600" : "text-orange-600"}`}>Balance</p>
          <p className={`text-2xl font-bold ${totalIngresos - totalPagos >= 0 ? "text-blue-700" : "text-orange-700"}`}>
            ${(totalIngresos - totalPagos).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* CALENDARIO */}
        <div className="lg:col-span-2 bg-white border rounded-xl p-4">
          {/* Navegación mes */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setMesActual(m => new Date(m.getFullYear(), m.getMonth() - 1))} className="p-1 hover:bg-gray-100 rounded">
              <ChevronLeft size={20} />
            </button>
            <h2 className="font-bold text-lg capitalize">
              {format(mesActual, "MMMM yyyy", { locale: es })}
            </h2>
            <button onClick={() => setMesActual(m => new Date(m.getFullYear(), m.getMonth() + 1))} className="p-1 hover:bg-gray-100 rounded">
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 mb-1">
            {DIAS.map(d => <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>)}
          </div>

          {/* Grid de días */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: primerDia }).map((_, i) => <div key={`empty-${i}`} />)}
            {diasDelMes.map(dia => {
              const evs = eventosDelDia(dia)
              const seleccionado = diaSeleccionado && isSameDay(dia, diaSeleccionado)
              return (
                <button
                  key={dia.toISOString()}
                  onClick={() => handleDiaClick(dia)}
                  className={`relative min-h-[56px] p-1 rounded-lg text-left transition-all border
                    ${seleccionado ? "border-blue-500 bg-blue-50" : "border-transparent hover:bg-gray-50"}
                    ${isToday(dia) ? "font-bold" : ""}
                  `}
                >
                  <span className={`text-xs ${isToday(dia) ? "bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center" : "text-gray-700"}`}>
                    {format(dia, "d")}
                  </span>
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    {evs.slice(0, 2).map(e => (
                      <div key={e.id} className={`text-[10px] rounded px-1 truncate ${e.tipo === "ingreso" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {e.titulo}
                      </div>
                    ))}
                    {evs.length > 2 && <div className="text-[10px] text-gray-400">+{evs.length - 2} más</div>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* PANEL LATERAL */}
        <div className="bg-white border rounded-xl p-4">
          {diaSeleccionado ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold capitalize">
                  {format(diaSeleccionado, "d 'de' MMMM", { locale: es })}
                </h3>
                <Button size="sm" onClick={handleAbrirFormulario}>
                  <Plus size={14} className="mr-1" /> Agregar
                </Button>
              </div>

              {/* Formulario */}
              {modalAgregar && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">Nuevo evento</p>
                    <button onClick={() => setModalAgregar(false)}><X size={14} /></button>
                  </div>
                  <div>
                    <Label className="text-xs">Título</Label>
                    <Input className="h-7 text-sm" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ej: Renta" />
                  </div>
                  <div>
                    <Label className="text-xs">Monto</Label>
                    <Input className="h-7 text-sm" type="number" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Tipo</Label>
                    <select className="w-full h-7 text-sm border rounded px-2" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as EventoTipo }))}>
                      <option value="pago">Pago</option>
                      <option value="ingreso">Ingreso</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Descripción (opcional)</Label>
                    <Input className="h-7 text-sm" value={form.descripcion ?? ""} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="recurrente" checked={form.recurrente} onChange={e => setForm(f => ({ ...f, recurrente: e.target.checked }))} />
                    <Label htmlFor="recurrente" className="text-xs">Recurrente mensual</Label>
                  </div>
                  <Button size="sm" className="w-full" onClick={handleGuardar} disabled={guardando}>
                    {guardando ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              )}

              {/* Eventos del día */}
              <div className="space-y-2">
                {eventosDelDia(diaSeleccionado).length === 0 && !modalAgregar && (
                  <p className="text-sm text-gray-400 text-center py-4">Sin eventos este día</p>
                )}
                {eventosDelDia(diaSeleccionado).map(evento => (
                  <div key={evento.id} className={`flex items-center justify-between p-2 rounded-lg border ${evento.tipo === "ingreso" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                    <div>
                      <p className="text-sm font-medium">{evento.titulo}</p>
                      <p className={`text-xs font-bold ${evento.tipo === "ingreso" ? "text-green-600" : "text-red-600"}`}>
                        {evento.tipo === "ingreso" ? "+" : "-"}${evento.monto.toLocaleString()}
                      </p>
                      {evento.descripcion && <p className="text-xs text-gray-400">{evento.descripcion}</p>}
                    </div>
                    <button onClick={() => handleEliminar(evento)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Selecciona un día para ver o agregar eventos</p>
          )}
        </div>
      </div>
    </div>
  )
}
