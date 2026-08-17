"use client"

import { Globe, Megaphone, BookOpen, Tv, Palette, BarChart3, Users } from "lucide-react"
import { useSectionTab, TabBar, PageHeader, Pending } from "./shared"
import { SitioWebMiraclesView } from "@/components/Empresa/Marketing/SitioWebMiraclesView"
import { CampanasEmpresaView } from "@/components/Empresa/Marketing/CampanasEmpresaView"
import { BlogView } from "@/components/Empresa/Marketing/BlogView"
import { AnunciosView } from "@/components/Empresa/Marketing/AnunciosView"
import { PromocionalesView } from "@/components/Empresa/Marketing/PromocionalesView"
import { EcosistemaView } from "@/components/Shared/EcosistemaView"

const TABS = [
  { id: "sitio-web",  label: "Sitio web",     icon: Globe },
  { id: "campanas",   label: "Campañas SEO",  icon: Megaphone },
  { id: "blog",       label: "Blog",          icon: BookOpen },
  { id: "anuncios",   label: "Anuncios",      icon: Tv },
  { id: "merch",      label: "Merch",         icon: Palette },
  { id: "metricas",   label: "Métricas",      icon: BarChart3 },
  { id: "integrantes",label: "Integrantes",   icon: Users },
]

export function SeccionMarketing() {
  const { tab, setTab } = useSectionTab("marketing", "sitio-web")
  const activo = TABS.find(t => t.id === tab) ?? TABS[0]

  return (
    <div>
      <PageHeader title="Marketing" breadcrumb={["Departamentos", "Marketing", activo.label]} />
      <div className="mb-4"><TabBar tabs={TABS} active={tab} onChange={setTab} /></div>
      {tab === "sitio-web"   && <SitioWebMiraclesView />}
      {tab === "campanas"    && <CampanasEmpresaView />}
      {tab === "blog"        && <BlogView />}
      {tab === "anuncios"    && <AnunciosView />}
      {tab === "merch"       && <PromocionalesView ambito="empresa" />}
      {tab === "metricas"    && <EcosistemaView ambito="empresa" />}
      {tab === "integrantes" && <Pending owner="Medallitadeoro" desc="Todavía no existe un directorio de colaboradores." />}
    </div>
  )
}
