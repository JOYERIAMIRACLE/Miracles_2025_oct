"use client"

import { Palette, LayoutTemplate, Images, Briefcase, ShoppingBag, Type } from "lucide-react"
import { useSectionTab, HeroTabs, Card, SeccionHero } from "./shared"
import { RecursosDescargables, type RecursoExtraTab } from "./RecursosDescargables"
import { MerchView } from "./MerchView"

const TABS = [
  { id: "identidad",  label: "Identidad de marca",     icon: Palette },
  { id: "plantillas", label: "Plantillas",              icon: LayoutTemplate },
  { id: "galeria",    label: "Galería",                 icon: Images },
  { id: "materiales", label: "Materiales comerciales",  icon: Briefcase },
  { id: "merch",      label: "Merch",                    icon: ShoppingBag },
]

function TabTipografia() {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <Card className="flex flex-col gap-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Títulos</p>
        <p className="text-2xl font-bold text-slate-400 dark:text-slate-500 italic">Pendiente de definir</p>
      </Card>
      <Card className="flex flex-col gap-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Texto</p>
        <p className="text-2xl text-slate-400 dark:text-slate-500 italic">Pendiente de definir</p>
      </Card>
    </div>
  )
}

function TabColorimetria() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {["Color 1", "Color 2", "Color 3", "Color 4"].map(nombre => (
        <Card key={nombre} className="flex flex-col gap-2 p-0! overflow-hidden">
          <div className="h-16 bg-slate-100 dark:bg-slate-800" />
          <div className="p-3">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{nombre}</p>
            <p className="text-[10px] text-slate-400 italic">Pendiente de definir</p>
          </div>
        </Card>
      ))}
    </div>
  )
}

const IDENTIDAD_EXTRA_TABS: RecursoExtraTab[] = [
  { id: "tipografia", label: "Tipografía", icon: Type, orden: 1000, content: <TabTipografia /> },
  { id: "colorimetria", label: "Colorimetría", icon: Palette, orden: 2000, content: <TabColorimetria /> },
]

export function SeccionGestionMarca() {
  const { tab, setTab } = useSectionTab("marca", "identidad")
  const activo = TABS.find(t => t.id === tab) ?? TABS[0]

  return (
    <div className="space-y-4">
      <SeccionHero
        breadcrumb={["Recursos", "Gestión de marca", activo.label]}
        titulo="Gestión de marca"
        descripcion="Identidad, plantillas, galería, materiales comerciales y merch — todo lo de marca en un solo lugar."
      >
        <HeroTabs tabs={TABS} active={tab} onChange={setTab} />
      </SeccionHero>
      {tab === "identidad"   && <RecursosDescargables seccion="marketing-identidad" layout="sidebar" extraTabs={IDENTIDAD_EXTRA_TABS} />}
      {tab === "plantillas"  && <RecursosDescargables seccion="marketing-plantillas" layout="sidebar" />}
      {tab === "galeria"     && <RecursosDescargables seccion="marketing-galeria" layout="sidebar" />}
      {tab === "materiales"  && <RecursosDescargables seccion="marketing-materiales" layout="sidebar" />}
      {tab === "merch"       && <MerchView />}
    </div>
  )
}
