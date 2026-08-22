"use client"

import type { LucideIcon } from "lucide-react"

export type TipoPuerta = "oficina" | "almacen" | "taller" | "aparador" | "arquitectura"

const TIPO_META: Record<TipoPuerta, { eyebrow: string; significado: string }> = {
  oficina:      { eyebrow: "OFICINA",      significado: "Accesos directos a las páginas reales — mismo menú de siempre, sin perder tiempo buscando." },
  almacen:      { eyebrow: "ALMACÉN",      significado: "Lo que hay guardado en la base de datos — para saber qué información existe y dónde administrarla." },
  taller:       { eyebrow: "TALLER",       significado: "Piezas de interfaz ya construidas, para probarlas o mostrarlas sin abrir el proyecto completo." },
  aparador:     { eyebrow: "APARADOR",     significado: "Lo que ve el público — la cara pública real, no una maqueta." },
  arquitectura: { eyebrow: "ARQUITECTURA", significado: "Cómo está armado por dentro — stack técnico, hosting, dominios y despliegue." },
}

interface Props {
  tipo:        TipoPuerta
  icon:        LucideIcon
  titulo:      string
  descripcion: string
}

/* Encabezado consistente para los 9 paneles del mapa — responde "para qué
   sirve esta puerta" en dos capas: qué significa este TIPO de puerta en
   general (oficina/almacén/taller/aparador/arquitectura), y qué hace esta
   instancia en particular. */
export function PortalPurposeHeader({ tipo, icon: Icon, titulo, descripcion }: Props) {
  const meta = TIPO_META[tipo]
  return (
    <div className="flex gap-3.5 pb-5 mb-1 border-b border-slate-800/60">
      <div className="shrink-0 w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
        <Icon size={20} className="text-violet-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-violet-400/70">
            {meta.eyebrow}
          </span>
          <span className="text-[9px] text-slate-700">·</span>
          <span className="text-[9px] text-slate-600">{meta.significado}</span>
        </div>
        <h3 className="text-sm font-bold text-slate-200 mb-1">{titulo}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{descripcion}</p>
      </div>
    </div>
  )
}
