"use client"

import { Palette, LayoutTemplate, Images, Briefcase, Megaphone, Globe, BarChart3, ShoppingBag } from "lucide-react"
import { useSectionTab, TabBar, Pending, SeccionHero, useHeroImagen } from "./shared"
import { useGetIdentidad } from "@/api/identidad-empresa/getIdentidad"
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
      {tab === "identidad"   && <Pending owner="Medallitadeoro" desc="Todavía no existe esta información en Miracles." />}
      {tab === "plantillas"  && <Pending owner="Medallitadeoro" desc="Todavía no existe esta información en Miracles." />}
      {tab === "galeria"     && <Pending owner="Medallitadeoro" desc="Todavía no existe esta información en Miracles." />}
      {tab === "materiales"  && <Pending owner="Medallitadeoro" desc="Todavía no existe esta información en Miracles." />}
      {tab === "campanas"    && <CampanasEmpresaView />}
      {tab === "sitio-web"   && <SitioWebMiraclesView />}
      {tab === "indicadores" && <EcosistemaView ambito="empresa" />}
      {tab === "merch"       && <PromocionalesView ambito="empresa" />}
    </div>
  )
}
