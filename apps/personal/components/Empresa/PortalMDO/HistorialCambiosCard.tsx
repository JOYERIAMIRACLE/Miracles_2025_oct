"use client"

import { Megaphone, Settings2, FolderOpen, BookOpen, type LucideIcon } from "lucide-react"

// Datos de ejemplo — mismo criterio que el resto del Dashboard (aún no
// conectado a un registro real de cambios; requeriría auditoría en Strapi
// por módulo cuando se defina qué eventos vale la pena rastrear).
const AREA_ICON: Record<string, LucideIcon> = {
  Comunicados: Megaphone,
  Operación:   Settings2,
  Recursos:    FolderOpen,
  Conoce:      BookOpen,
}

const EVENTOS = [
  { area: "Comunicados", texto: "Se publicó el comunicado “Nuevo portal Medallita de oro”", autor: "Ricardo", cuando: "hace 2 días" },
  { area: "Operación",   texto: "Se actualizó el estado de un pedido en Ventas",                        autor: "Ricardo", cuando: "hace 3 días" },
  { area: "Recursos",    texto: "Se agregó un nuevo material descargable",                              autor: "Ricardo", cuando: "hace 5 días" },
  { area: "Conoce",      texto: "Se editó la sección “¿Quiénes somos?”",                       autor: "Ricardo", cuando: "hace 1 semana" },
  { area: "Comunicados", texto: "Se archivó el comunicado “Cierre de temporada”",              autor: "Ricardo", cuando: "hace 1 semana" },
]

export function HistorialCambiosCard() {
  return (
    <section className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Historial de cambios</h2>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/25">Datos de ejemplo</span>
      </div>

      <div>
        {EVENTOS.map((e, i) => {
          const Icon = AREA_ICON[e.area] ?? Megaphone
          return (
            <div key={i} className="flex gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <div className="h-8 w-8 rounded-lg bg-violet-500/15 text-violet-500 flex items-center justify-center shrink-0">
                <Icon size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-snug">{e.texto}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  <span className="font-medium text-violet-500">{e.area}</span> · {e.autor} · {e.cuando}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
