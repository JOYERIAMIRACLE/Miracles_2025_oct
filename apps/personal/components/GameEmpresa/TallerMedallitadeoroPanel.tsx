"use client"

import { useState } from "react"
import {
  Puzzle, Eye, BarChart3, Globe2, Target, CheckSquare, Megaphone, Users,
  ShoppingBag, Package, TrendingUp, ShoppingCart as CartIcon, Heart, User, Expand,
} from "lucide-react"

const TABS = [
  { id: "oficina", label: "Oficina (admin)" },
  { id: "tienda",  label: "Tienda (público)" },
] as const
type TabId = typeof TABS[number]["id"]

const OFICINA_CATS = [
  { id: "sidebar", label: "Sidebar" },
  { id: "tablas",  label: "Tablas de datos" },
  { id: "forms",   label: "Forms" },
] as const
const TIENDA_CATS = [
  { id: "navbar", label: "Navbar" },
  { id: "card",   label: "Card de producto" },
] as const

function Vivo({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest mb-2">
      <Eye size={11} className="text-emerald-400" /> <span className="text-emerald-400/80">{children}</span>
    </div>
  )
}

const GRUPOS = [
  { titulo: "Indicadores",     color: "violet",  items: [{ l: "Financieros", i: BarChart3 }, { l: "Ecosistema", i: Globe2 }] },
  { titulo: "Gestión General", color: "sky",     items: [{ l: "Identidad", i: Target }, { l: "Tareas", i: CheckSquare }] },
  { titulo: "Marketing",       color: "blue",    items: [{ l: "Sitio web", i: Globe2 }, { l: "Campañas SEO", i: Megaphone }] },
  { titulo: "Ventas",          color: "emerald", items: [{ l: "Pipeline", i: Users }, { l: "Pedidos", i: ShoppingBag }] },
  { titulo: "Suministro",      color: "amber",   items: [{ l: "Catálogo", i: Package }, { l: "Inventario", i: Package }] },
  { titulo: "Finanzas",        color: "rose",    items: [{ l: "Ingresos", i: TrendingUp }] },
]

function SidebarOficinaDemo() {
  return (
    <div>
      <Vivo>Vivo — recorte de EmpresaSidebar.tsx (6 de 7 grupos)</Vivo>
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

function TablasOficinaDemo() {
  const filas = ["Producto de prueba 1", "Producto de prueba 2"]
  return (
    <div>
      <Vivo>Vivo — patrón real de InventarioEmpresaView.tsx</Vivo>
      <div className="max-w-md bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="border-b border-slate-800 bg-slate-950/50">
            <tr>
              <th className="h-9 px-3 text-left text-[10px] font-semibold text-slate-500 uppercase">Producto</th>
              <th className="h-9 px-3 text-left text-[10px] font-semibold text-slate-500 uppercase">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filas.map(f => (
              <tr key={f} className="hover:bg-slate-800/40 transition-colors group cursor-pointer">
                <td className="px-3 py-2.5 text-slate-300">{f}</td>
                <td className="px-3 py-2.5 text-slate-400 tabular-nums">8</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FormsOficinaDemo() {
  return (
    <div>
      <Vivo>Vivo — datos de prueba, mismo inp de InventarioEmpresaView.tsx</Vivo>
      <div className="max-w-sm space-y-2.5">
        <input placeholder="Nombre del producto (prueba)"
          className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" />
        <input placeholder="SKU (prueba)"
          className="w-full h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" />
      </div>
    </div>
  )
}

function NavbarDemo() {
  return (
    <div>
      <Vivo>Vivo — 1tiendacomponentes/navbar.tsx (contador real de carrito/favoritos)</Vivo>
      <div className="max-w-lg flex items-center justify-between px-5 py-3 rounded-xl border border-slate-800 bg-slate-900">
        <span className="font-serif font-bold text-slate-200 tracking-wide">💍 Medallita de Oro</span>
        <div className="flex items-center gap-4 text-slate-400">
          <div className="flex items-center gap-1">
            <CartIcon size={16} strokeWidth={1.5} />
            <span className="text-xs">2</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart size={16} strokeWidth={1.5} />
            <span className="text-xs">3</span>
          </div>
          <User size={16} strokeWidth={1.5} />
        </div>
      </div>
    </div>
  )
}

function CardDemo() {
  return (
    <div>
      <Vivo>Vivo — product-card1.tsx (badges + carrusel on-hover, datos de prueba)</Vivo>
      <div className="max-w-[220px] group/card relative p-2 rounded-lg hover:shadow-md">
        <div className="absolute flex items-center gap-1.5 px-2 z-10 top-4">
          <span className="px-2 py-0.5 text-[10px] text-white bg-black/70 rounded-full">Cruz</span>
          <span className="px-2 py-0.5 text-[10px] text-white bg-amber-800/80 rounded-full">Oro 10k</span>
        </div>
        <div className="w-full aspect-square rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center relative">
          <span className="text-5xl opacity-40">💍</span>
          <div className="absolute w-full px-6 flex justify-center gap-4 bottom-4 opacity-0 group-hover/card:opacity-100 transition-opacity">
            <Expand size={16} className="text-slate-300" />
            <CartIcon size={16} className="text-slate-300" />
          </div>
        </div>
        <p className="text-sm font-semibold text-center mt-2 text-slate-200">Dije Cruz (prueba)</p>
        <p className="text-xs text-center text-slate-500 font-mono">O10-DIJ-CRZ</p>
        <p className="font-bold text-center mt-1 text-slate-100">$1,850 MXN</p>
      </div>
    </div>
  )
}

export function TallerMedallitadeoroPanel() {
  const [tab, setTab] = useState<TabId>("oficina")
  const [oficinaCat, setOficinaCat] = useState<typeof OFICINA_CATS[number]["id"]>("sidebar")
  const [tiendaCat, setTiendaCat]   = useState<typeof TIENDA_CATS[number]["id"]>("navbar")

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Puzzle size={16} className="text-violet-400" />
        <p className="text-xs text-slate-500">
          Piezas propias de medallitadeoro — oficina (admin) y tienda (público), renderizadas de verdad.
        </p>
      </div>

      <div className="flex gap-1.5">
        {TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`h-8 px-3 rounded-lg text-xs font-medium border transition-all ${
              tab === t.id
                ? "bg-violet-600/20 text-violet-300 border-violet-500/40"
                : "border-slate-700 text-slate-500 hover:text-slate-300"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "oficina" && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {OFICINA_CATS.map(cat => (
              <button key={cat.id} type="button" onClick={() => setOficinaCat(cat.id)}
                className={`h-7 px-2.5 rounded-lg text-[11px] font-medium border transition-all ${
                  oficinaCat === cat.id
                    ? "bg-violet-600/20 text-violet-300 border-violet-500/40"
                    : "border-slate-700 text-slate-500 hover:text-slate-300"
                }`}>
                {cat.label}
              </button>
            ))}
          </div>
          <div className="pt-1">
            {oficinaCat === "sidebar" && <SidebarOficinaDemo />}
            {oficinaCat === "tablas"  && <TablasOficinaDemo />}
            {oficinaCat === "forms"   && <FormsOficinaDemo />}
          </div>
        </>
      )}

      {tab === "tienda" && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {TIENDA_CATS.map(cat => (
              <button key={cat.id} type="button" onClick={() => setTiendaCat(cat.id)}
                className={`h-7 px-2.5 rounded-lg text-[11px] font-medium border transition-all ${
                  tiendaCat === cat.id
                    ? "bg-violet-600/20 text-violet-300 border-violet-500/40"
                    : "border-slate-700 text-slate-500 hover:text-slate-300"
                }`}>
                {cat.label}
              </button>
            ))}
          </div>
          <div className="pt-1">
            {tiendaCat === "navbar" && <NavbarDemo />}
            {tiendaCat === "card"   && <CardDemo />}
          </div>
        </>
      )}
    </div>
  )
}
