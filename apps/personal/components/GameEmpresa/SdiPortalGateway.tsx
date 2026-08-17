"use client"

import { ExternalLink, ShieldAlert } from "lucide-react"

const SDI_PORTAL_URL = "https://sdi-portal.pages.dev"

export function SdiPortalGateway() {
  return (
    <div className="p-5 space-y-5">
      <p className="text-xs text-slate-500">
        SDI Portal es otro proyecto — repo, dominio y Strapi separados de Miracles. No se puede
        "entrar" aquí adentro; este edificio es una puerta hacia el sitio real.
      </p>

      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 flex items-start gap-3">
        <ShieldAlert size={16} className="text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400">
          Se abre en una pestaña nueva y pide tu sesión de SDI Portal — no comparte el login de Miracles.
        </p>
      </div>

      <a
        href={SDI_PORTAL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 h-11 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
      >
        Abrir SDI Portal <ExternalLink size={14} />
      </a>
    </div>
  )
}
