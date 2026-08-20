"use client"

import { Users, UserSearch, FileText, ShoppingBag, UserCheck } from "lucide-react"
import { useSectionTab, TabBar, SeccionHero, useHeroImagen } from "./shared"
import { useGetIdentidad } from "@/api/identidad-empresa/getIdentidad"
import { PipelineView } from "@/components/Empresa/Ventas/PipelineView"
import { ClientesView } from "@/components/Empresa/Ventas/ClientesView"
import { LeadsView } from "@/components/Empresa/Ventas/LeadsView"
import { CotizacionesView } from "@/components/Empresa/Ventas/CotizacionesView"
import { PedidosView } from "@/components/Empresa/Ventas/PedidosView"

const TABS = [
  { id: "pipeline",     label: "Pipeline (CRM)", icon: Users },
  { id: "leads",        label: "Leads",          icon: UserSearch },
  { id: "cotizaciones", label: "Cotizaciones",   icon: FileText },
  { id: "pedidos",      label: "Pedidos",        icon: ShoppingBag },
  { id: "clientes",     label: "Clientes",       icon: UserCheck },
]

export function SeccionComercial() {
  const { tab, setTab } = useSectionTab("comercial", "pipeline")
  const activo = TABS.find(t => t.id === tab) ?? TABS[0]
  const { identidad, loading, reload } = useGetIdentidad()
  const documentId = identidad?.documentId ?? null
  const hero = useHeroImagen("portada_depto_comercial", documentId, reload)

  return (
    <div className="space-y-4">
      <SeccionHero
        breadcrumb={["Departamentos", "Comercial", activo.label]}
        titulo="Comercial"
        descripcion={identidad?.descripcion_depto_comercial || "Pipeline, cotizaciones, pedidos y clientes de medallitadeoro."}
        campoDescripcion="descripcion_depto_comercial"
        onDescripcionGuardada={reload}
        imagenUrl={identidad?.portada_depto_comercial?.url}
        imagenOriginalUrl={identidad?.portada_depto_comercial_original?.url}
        documentId={documentId}
        puedeEditar={!loading}
        uploading={hero.uploading}
        inputRef={hero.inputRef}
        onTrigger={hero.trigger}
        onFileChange={hero.handleFile}
        onSaveCrop={hero.saveCrop}
      />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      {tab === "pipeline"     && <PipelineView />}
      {tab === "leads"        && <LeadsView />}
      {tab === "cotizaciones" && <CotizacionesView />}
      {tab === "pedidos"      && <PedidosView />}
      {tab === "clientes"     && <ClientesView />}
    </div>
  )
}
