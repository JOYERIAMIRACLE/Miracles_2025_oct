"use client"

import { useState } from "react"
import { Puzzle, Eye, LayoutDashboard, CalendarDays, Wallet, Dumbbell, CalendarRange, ChefHat, ShoppingCart, Car, Users, CalendarHeart, CheckSquare, FolderOpen, Menu } from "lucide-react"
import { PortalPurposeHeader } from "@/components/GameEmpresa/PortalPurposeHeader"

const CATEGORIAS = [
  { id: "sidebar", label: "Sidebar" },
  { id: "header",  label: "Header" },
  { id: "forms",   label: "Forms" },
] as const

type CategoriaId = typeof CATEGORIAS[number]["id"]

function Vivo({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest mb-2">
      <Eye size={11} className="text-emerald-400" /> <span className="text-emerald-400/80">{children}</span>
    </div>
  )
}

const GRUPOS = [
  { titulo: "Productividad", color: "purple", items: [{ l: "Tareas", i: CheckSquare }, { l: "Material Digital", i: FolderOpen }] },
  { titulo: "Salud — Financiera", color: "cyan", items: [{ l: "Dashboard", i: LayoutDashboard }, { l: "Presupuesto", i: Wallet }, { l: "Calendario", i: CalendarDays }] },
  { titulo: "Salud — Ejercicio", color: "green", items: [{ l: "Ejercicio", i: Dumbbell }, { l: "Planeador", i: CalendarRange }] },
  { titulo: "Salud — Alimentación", color: "amber", items: [{ l: "Recetario", i: ChefHat }, { l: "Compras", i: ShoppingCart }] },
  { titulo: "Salud — Hogar y Vehículos", color: "teal", items: [{ l: "Vehículos", i: Car }] },
  { titulo: "Salud — Social", color: "pink", items: [{ l: "Personas", i: Users }, { l: "Eventos", i: CalendarHeart }] },
]

function SidebarDemo() {
  return (
    <div>
      <Vivo>Vivo — las 6 secciones reales de PersonalSidebar.tsx</Vivo>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3 max-w-xs">
        {GRUPOS.map(g => (
          <div key={g.titulo}>
            <p className={`text-[9px] font-bold uppercase tracking-widest text-${g.color}-400 mb-1`}>{g.titulo}</p>
            {g.items.map(item => (
              <div key={item.l} className="flex items-center gap-2 text-xs text-slate-400 py-1 px-2 rounded hover:bg-slate-800/60">
                <item.i size={12} /> {item.l}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function HeaderDemo() {
  return (
    <div>
      <Vivo>Vivo — PersonalHeader.tsx (título cambia por ruta)</Vivo>
      <header className="max-w-md h-12 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/95 px-4 rounded-t-lg">
        <div className="flex items-center gap-3">
          <Menu size={16} className="text-slate-400" />
          <h1 className="text-sm font-semibold text-slate-300">Gestión Personal (prueba)</h1>
        </div>
        <div className="h-7 w-7 rounded-md bg-linear-to-br from-cyan-500 to-violet-600 text-white flex items-center justify-center text-[10px] font-bold">
          RR
        </div>
      </header>
      <div className="max-w-md h-6 bg-slate-900/40 rounded-b-lg border border-t-0 border-slate-800/60" />
    </div>
  )
}

function FormsDemo() {
  return (
    <div>
      <Vivo>Vivo — datos de prueba, patrón inputCls de gestion-personal</Vivo>
      <div className="max-w-sm space-y-2.5">
        <input placeholder="Nombre de la meta de ahorro (prueba)"
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500 transition" />
        <input placeholder="Monto objetivo (prueba)" type="number"
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 outline-none focus:border-slate-500 transition" />
      </div>
    </div>
  )
}

export function TallerRichiavrodPanel() {
  const [activa, setActiva] = useState<CategoriaId>("sidebar")

  return (
    <div className="p-5 space-y-5">
      <PortalPurposeHeader
        tipo="taller"
        icon={Puzzle}
        titulo="Taller — Richiavrod"
        descripcion="Componentes reales de gestión-personal, aislados para verlos o mostrarlos sin abrir el proyecto completo — con datos de prueba, no datos reales."
      />

      <div className="flex flex-wrap gap-1.5">
        {CATEGORIAS.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiva(cat.id)}
            className={`h-7 px-2.5 rounded-lg text-[11px] font-medium border transition-all ${
              activa === cat.id
                ? "bg-teal-600/20 text-teal-300 border-teal-500/40"
                : "border-slate-700 text-slate-500 hover:text-slate-300"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {activa === "sidebar" && <SidebarDemo />}
        {activa === "header"  && <HeaderDemo />}
        {activa === "forms"   && <FormsDemo />}
      </div>
    </div>
  )
}
