"use client"

import { Palette, LayoutTemplate, Images, Briefcase, ShoppingBag, Type } from "lucide-react"
import { useSectionTab, SeccionVitrina, ContenidoTabs, Card, SeccionHeroContenido, useHeroImagen } from "./shared"
import { useGetIdentidad } from "@/api/identidad-empresa/getIdentidad"
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
      <Card className="flex flex-col gap-1.5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Interfaz — Tienda y Portal</p>
        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">Geist Sans</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">Títulos, texto y botones en todo el sitio y el panel interno.</p>
      </Card>
      <Card className="flex flex-col gap-1.5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logotipo</p>
        <p className="text-3xl text-slate-800 dark:text-slate-100" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Medalla de Oro</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">Serif clásica de alto contraste, dibujada solo para el isologo — no se usa en el resto del sitio.</p>
      </Card>
    </div>
  )
}

const COLORES_MARCA = [
  { nombre: "Dorado",        hex: "#BD9206" },
  { nombre: "Negro",         hex: "#121212" },
  { nombre: "Morado oscuro", hex: "#2A1B3D" },
  { nombre: "Blanco hueso",  hex: "#F8F9FA" },
]

function TabColorimetria() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {COLORES_MARCA.map(c => (
        <Card key={c.hex} className="flex flex-col gap-2 p-0! overflow-hidden">
          <div className="h-16 border-b border-slate-200 dark:border-slate-700" style={{ backgroundColor: c.hex }} />
          <div className="p-3">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{c.nombre}</p>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wide">{c.hex}</p>
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
  const { identidad, loading, reload } = useGetIdentidad()
  const documentId = identidad?.documentId ?? null
  const hero = useHeroImagen("portada_marca", documentId, reload)

  return (
    <SeccionVitrina>
      <SeccionHeroContenido
        breadcrumb={["Recursos", "Gestión de marca", activo.label]}
        titulo="Gestión de marca"
        descripcion={identidad?.descripcion_marca || "Identidad, plantillas, galería, materiales comerciales y merch — todo lo de marca en un solo lugar."}
        campoDescripcion="descripcion_marca"
        onDescripcionGuardada={reload}
        documentId={documentId}
        puedeEditar={!loading}
      >
        <ContenidoTabs tabs={TABS} active={tab} onChange={setTab} />
      </SeccionHeroContenido>
      {tab === "identidad"   && <RecursosDescargables seccion="marketing-identidad" layout="sidebar" extraTabs={IDENTIDAD_EXTRA_TABS} />}
      {tab === "plantillas"  && <RecursosDescargables seccion="marketing-plantillas" layout="sidebar" />}
      {tab === "galeria"     && <RecursosDescargables seccion="marketing-galeria" layout="sidebar" />}
      {tab === "materiales"  && <RecursosDescargables seccion="marketing-materiales" layout="sidebar" />}
      {tab === "merch"       && <MerchView />}
    </SeccionVitrina>
  )
}
