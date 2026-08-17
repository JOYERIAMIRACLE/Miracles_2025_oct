"use client"

import { Archive, ExternalLink, Server } from "lucide-react"

export interface AlmacenEstante {
  nombre: string
  fichas: string
}

export interface InfraItem {
  label: string
  valor: string
}

interface Props {
  titulo: string
  totalFichas: number
  estantes: AlmacenEstante[]
  adminUrl: string
  notaCompartida?: string
  infraestructura?: InfraItem[]
}

export function AlmacenPanel({ titulo, totalFichas, estantes, adminUrl, notaCompartida, infraestructura }: Props) {
  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Archive size={16} className="text-violet-400" />
        <p className="text-xs text-slate-500">
          {titulo} — {totalFichas} fichas guardadas en Strapi.
        </p>
      </div>

      {notaCompartida && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
          <p className="text-xs text-slate-400">{notaCompartida}</p>
        </div>
      )}

      <div className="space-y-3">
        {estantes.map(estante => (
          <div
            key={estante.nombre}
            className="rounded-lg border border-slate-800/60 bg-slate-900/40 px-4 py-3"
          >
            <p className="text-[10px] font-mono uppercase tracking-widest text-violet-500/60 mb-1">
              {estante.nombre}
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">{estante.fichas}</p>
          </div>
        ))}
      </div>

      {infraestructura && infraestructura.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Server size={13} className="text-violet-400" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-violet-500/60">
              Infraestructura
            </p>
          </div>
          <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 divide-y divide-slate-800/60">
            {infraestructura.map(item => (
              <div key={item.label} className="flex items-start justify-between gap-4 px-4 py-2.5">
                <span className="text-xs text-slate-500 shrink-0">{item.label}</span>
                <span className="text-xs text-slate-300 text-right">{item.valor}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <a
        href={adminUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 h-11 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
      >
        Abrir Strapi Admin <ExternalLink size={14} />
      </a>
      <p className="text-[10px] text-slate-600 text-center -mt-2">
        Pide tu login de Strapi — es otra sesión, no la del portal.
      </p>
    </div>
  )
}
