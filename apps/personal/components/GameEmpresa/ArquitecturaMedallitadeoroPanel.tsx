"use client"

import {
  Network, Globe2, GitBranch, Server, ExternalLink, FolderTree,
} from "lucide-react"
import { PortalPurposeHeader } from "@/components/GameEmpresa/PortalPurposeHeader"

const STACK = [
  { label: "Frontend",           valor: "Next.js 15 + React 19 · Tailwind CSS v4" },
  { label: "Backend",            valor: "Strapi v5" },
  { label: "Base de datos",      valor: "PostgreSQL" },
  { label: "Hosting frontend",   valor: "Cloudflare Pages (estático, output: \"export\")" },
  { label: "Hosting backend",    valor: "Railway (migrado desde Render, jul-2026)" },
  { label: "Imágenes",           valor: "Cloudinary (25GB gratis)" },
  { label: "Documentos privados", valor: "Cloudflare R2 + Strapi upload provider (pendiente, Fase 1 en cero)" },
  { label: "Auth",               valor: "Strapi JWT" },
]

const APPS = [
  { nombre: "apps/personal", detalle: "Contiene hoy gestión-empresa + gestión-personal + tienda, todavía sin separar (Fase 3/4/5 pendientes)" },
  { nombre: "apps/backend",  detalle: "Strapi v5 — bodega compartida de las 3 apps del monorepo" },
]
const PACKAGES = ["types", "utils", "config-tailwind", "ui"]

const DOMINIOS = [
  { dominio: "app.medallitadeoro.com", uso: "Gestión de empresa (este portal)", estado: "En uso — subdominio gratis" },
  { dominio: "medallitadeoro.com",     uso: "Tienda pública",                   estado: "Pendiente comprar" },
]

function Seccion({ icon: Icon, titulo, children }: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  titulo: string; children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={13} className="text-violet-400" />
        <p className="text-[10px] font-mono uppercase tracking-widest text-violet-500/60">{titulo}</p>
      </div>
      {children}
    </div>
  )
}

export function ArquitecturaMedallitadeoroPanel() {
  return (
    <div className="p-5 space-y-6">
      <PortalPurposeHeader
        tipo="arquitectura"
        icon={Network}
        titulo="Arquitectura — Medallitadeoro"
        descripcion="El monorepo, el stack y el despliegue completos — aparte de lo que hace gestión-empresa día a día, esto es cómo está armado por dentro."
      />

      <Seccion icon={Server} titulo="Stack">
        <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 divide-y divide-slate-800/60">
          {STACK.map(item => (
            <div key={item.label} className="flex items-start justify-between gap-4 px-4 py-2.5">
              <span className="text-xs text-slate-500 shrink-0">{item.label}</span>
              <span className="text-xs text-slate-300 text-right">{item.valor}</span>
            </div>
          ))}
        </div>
      </Seccion>

      <Seccion icon={FolderTree} titulo="Monorepo (Turborepo + pnpm)">
        <div className="space-y-2">
          {APPS.map(a => (
            <div key={a.nombre} className="rounded-lg border border-slate-800/60 bg-slate-900/40 px-4 py-2.5">
              <p className="text-xs font-mono text-violet-300">{a.nombre}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{a.detalle}</p>
            </div>
          ))}
          <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 px-4 py-2.5">
            <p className="text-xs font-mono text-violet-300">packages/</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{PACKAGES.join(" · ")}</p>
          </div>
        </div>
        <p className="text-[10px] text-slate-600 mt-2">
          Apps hermanas del mismo monorepo, ciclos de vida distintos: tienda-medallitadeoro (pública) y portal-richiavrod (identidad personal).
        </p>
      </Seccion>

      <Seccion icon={Globe2} titulo="Dominios">
        <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 divide-y divide-slate-800/60">
          {DOMINIOS.map(d => (
            <div key={d.dominio} className="flex items-center justify-between gap-4 px-4 py-2.5">
              <div>
                <p className="text-xs font-mono text-slate-300">{d.dominio}</p>
                <p className="text-[10px] text-slate-600">{d.uso}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${
                d.estado.startsWith("En uso")
                  ? "border-emerald-500/25 text-emerald-400/80 bg-emerald-500/5"
                  : "border-amber-500/25 text-amber-500/70 bg-amber-500/5"
              }`}>{d.estado}</span>
            </div>
          ))}
        </div>
      </Seccion>

      <Seccion icon={GitBranch} titulo="Repo y despliegue">
        <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 px-4 py-3 space-y-1.5">
          <p className="text-xs text-slate-400">
            <span className="font-mono text-slate-300">JOYERIAMIRACLE/Miracles_2025_oct</span> en GitHub (público) — carpeta local <span className="font-mono text-slate-300">Desktop/Miracles</span>
          </p>
          <p className="text-[11px] text-slate-500">
            Push a <span className="font-mono">main</span> despliega todo automático: Cloudflare Pages (frontend, ~1-2 min) y Railway (backend, ~2-3 min cuando hay cambios de schema).
          </p>
        </div>
      </Seccion>

      <a
        href="https://github.com/JOYERIAMIRACLE/Miracles_2025_oct"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 h-11 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
      >
        Ver repositorio en GitHub <ExternalLink size={14} />
      </a>
    </div>
  )
}
