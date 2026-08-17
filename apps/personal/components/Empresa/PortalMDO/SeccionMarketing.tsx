"use client"

import { Palette, LayoutTemplate, Images, Briefcase, Megaphone, Globe, BarChart3, ShoppingBag, Type } from "lucide-react"
import { useSectionTab, TabBar, Card, SeccionHero, useHeroImagen } from "./shared"
import { useGetIdentidad } from "@/api/identidad-empresa/getIdentidad"
import { RecursosDescargables, type RecursoExtraTab } from "./RecursosDescargables"
import { SitioWebMiraclesView } from "@/components/Empresa/Marketing/SitioWebMiraclesView"
import { CampanasEmpresaView } from "@/components/Empresa/Marketing/CampanasEmpresaView"
import { PromocionalesView } from "@/components/Empresa/Marketing/PromocionalesView"
import { EcosistemaView } from "@/components/Shared/EcosistemaView"

const TABS = [
  { id: "identidad",  label: "Identidad de marca",     icon: Palette },
  { id: "plantillas", label: "Plantillas",              icon: LayoutTemplate },
  { id: "galeria",    label: "Galería",                 icon: Images },
  { id: "materiales", label: "Materiales comerciales",  icon: Briefcase },
  { id: "campanas",   label: "Campañas",                icon: Megaphone },
  { id: "sitio-web",  label: "Sitio web",                icon: Globe },
  { id: "indicadores",label: "Indicadores",              icon: BarChart3 },
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

export function SeccionMarketing() {
  const { tab, setTab } = useSectionTab("marketing", "identidad")
  const activo = TABS.find(t => t.id === tab) ?? TABS[0]
  const { identidad, loading, reload } = useGetIdentidad()
  const documentId = identidad?.documentId ?? null
  const hero = useHeroImagen("portada_depto_marketing", documentId, reload)

  return (
    <div className="space-y-4">
      <SeccionHero
        breadcrumb={["Departamentos", "Marketing", activo.label]}
        titulo="Marketing"
        descripcion={identidad?.descripcion_depto_marketing || "Identidad de marca, plantillas, campañas y sitio web de medallitadeoro."}
        campoDescripcion="descripcion_depto_marketing"
        onDescripcionGuardada={reload}
        imagenUrl={identidad?.portada_depto_marketing?.url}
        imagenOriginalUrl={identidad?.portada_depto_marketing_original?.url}
        documentId={documentId}
        puedeEditar={!loading}
        uploading={hero.uploading}
        inputRef={hero.inputRef}
        onTrigger={hero.trigger}
        onFileChange={hero.handleFile}
        onSaveCrop={hero.saveCrop}
      />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      {tab === "identidad"   && <RecursosDescargables seccion="marketing-identidad" layout="sidebar" extraTabs={IDENTIDAD_EXTRA_TABS} />}
      {tab === "plantillas"  && <RecursosDescargables seccion="marketing-plantillas" layout="sidebar" />}
      {tab === "galeria"     && <RecursosDescargables seccion="marketing-galeria" layout="sidebar" />}
      {tab === "materiales"  && <RecursosDescargables seccion="marketing-materiales" layout="sidebar" />}
      {tab === "campanas"    && <CampanasEmpresaView />}
      {tab === "sitio-web"   && <SitioWebMiraclesView />}
      {tab === "indicadores" && <EcosistemaView ambito="empresa" />}
      {tab === "merch"       && <PromocionalesView ambito="empresa" />}
    </div>
  )
}
