"use client"

import { Megaphone, History } from "lucide-react"
import { AREA_ICON, EVENTOS_HISTORIAL } from "./HistorialCambiosCard"

export function HistorialTickerCard({ onOpen }: { onOpen: () => void }) {
  // Se duplica la lista para que el loop ambiental de translateY(-50%) sea continuo, sin salto.
  const dobles = [...EVENTOS_HISTORIAL, ...EVENTOS_HISTORIAL]

  return (
    <div className="group w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700 transition-all overflow-hidden">
      <button type="button" onClick={onOpen} className="w-full flex items-center justify-between px-4 pt-3 pb-2 text-left">
        <div className="flex items-center gap-1.5">
          <History size={13} className="text-violet-500" />
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200">Historial de cambios</h3>
        </div>
        <span className="text-[10px] text-violet-500 group-hover:text-violet-600 dark:group-hover:text-violet-400 font-medium">Ver todo</span>
      </button>

      <div className="relative h-24 mx-2 mb-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
        {/* Loop ambiental — decorativo, activo mientras no hay hover */}
        <div className="absolute inset-0 overflow-hidden group-hover:hidden">
          <div className="animate-marquee-vertical">
            {dobles.map((e, i) => {
              const Icon = AREA_ICON[e.area] ?? Megaphone
              return (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5">
                  <div className="h-5 w-5 rounded bg-violet-500/15 text-violet-500 flex items-center justify-center shrink-0">
                    <Icon size={10} />
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">{e.texto}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Scroll real — en hover, lista sin duplicar: tope arriba = mas reciente, tope abajo = mas antiguo */}
        <div className="hidden group-hover:block absolute inset-0 overflow-y-auto">
          {EVENTOS_HISTORIAL.map((e, i) => {
            const Icon = AREA_ICON[e.area] ?? Megaphone
            return (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5">
                <div className="h-5 w-5 rounded bg-violet-500/15 text-violet-500 flex items-center justify-center shrink-0">
                  <Icon size={10} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">{e.texto}</p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500">{e.cuando}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-slate-50 dark:from-slate-800/40 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-slate-50 dark:from-slate-800/40 to-transparent" />
      </div>
    </div>
  )
}
