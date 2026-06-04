"use client"

import { CalendarHeart } from "lucide-react"

export function EventosSocialView() {
  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-pink-500/15 border border-pink-500/20 flex items-center justify-center">
          <CalendarHeart className="h-4 w-4 text-pink-400" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Eventos</h1>
          <p className="text-xs text-slate-500">Reuniones, celebraciones y momentos sociales</p>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-10 flex flex-col items-center justify-center text-center gap-3">
        <CalendarHeart size={32} className="text-slate-700" />
        <p className="text-sm text-slate-500">Módulo en construcción</p>
        <p className="text-xs text-slate-600 max-w-xs">
          Aquí podrás registrar eventos sociales — cumpleaños, reuniones familiares, salidas con amigos y más.
        </p>
      </div>
    </div>
  )
}
