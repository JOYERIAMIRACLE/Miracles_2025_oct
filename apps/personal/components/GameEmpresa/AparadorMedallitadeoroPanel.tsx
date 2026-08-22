"use client"

import Link from "next/link"
import { Store, ArrowRight } from "lucide-react"
import { PortalPurposeHeader } from "@/components/GameEmpresa/PortalPurposeHeader"

/* Mismas categorías reales de 1tiendacomponentes/menu-list.tsx — si cambian
   ahí, actualizar aquí también (es una copia de exhibición, no viene de Strapi). */
const CATEGORIAS = [
  { nombre: "Anillos",   desc: "Solitarios y alianzas, oro 10k y plata 925" },
  { nombre: "Cadenas",   desc: "Cartier, figaro, cubana y más" },
  { nombre: "Esclavas",  desc: "Para dama y caballero" },
  { nombre: "Aretes",    desc: "Argollas, palitos, gota y más" },
  { nombre: "Broqueles", desc: "Pequeños, para uso diario" },
  { nombre: "Dijes",     desc: "Figuras y símbolos para personalizar" },
  { nombre: "Pulsos",    desc: "Pulseras y brazaletes" },
  { nombre: "Rosarios",  desc: "Artesanales, oro 10k y plata 925" },
  { nombre: "Argollas",  desc: "Compromiso y matrimonio, todos los tamaños" },
]

export function AparadorMedallitadeoroPanel() {
  return (
    <div className="p-5 space-y-5">
      <PortalPurposeHeader
        tipo="aparador"
        icon={Store}
        titulo="Aparador — Medallitadeoro"
        descripcion="Lo que ve el cliente ahora mismo en medallitadeoro.com — la tienda pública real, no una vista previa ni una maqueta."
      />

      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-violet-500/60 mb-2">
          Categorías en catálogo
        </p>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIAS.map(cat => (
            <div key={cat.nombre} className="rounded-lg border border-slate-800/60 bg-slate-900/40 px-3 py-2.5">
              <p className="text-xs font-medium text-slate-300">{cat.nombre}</p>
              <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">{cat.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <Link
        href="/tienda"
        className="flex items-center justify-center gap-2 h-11 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
      >
        Ir a la tienda <ArrowRight size={14} />
      </Link>
    </div>
  )
}
