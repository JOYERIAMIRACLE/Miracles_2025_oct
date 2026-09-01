"use client"

import { UserCheck, Handshake } from "lucide-react"
import { useSectionTab, HeroTabs, SeccionHero, useHeroImagen } from "./shared"
import { useGetIdentidad } from "@/api/identidad-empresa/getIdentidad"
import { ClientesView } from "@/components/Empresa/Ventas/ClientesView"
import { ProveedoresView } from "@/components/Empresa/Compras/ProveedoresView"

const TABS = [
  { id: "clientes",    label: "Clientes",    icon: UserCheck },
  { id: "proveedores", label: "Proveedores", icon: Handshake },
]

export function SeccionContactos() {
  const { tab, setTab } = useSectionTab("contactos", "clientes")
  const activo = TABS.find(t => t.id === tab) ?? TABS[0]
  const { identidad, loading, reload } = useGetIdentidad()
  const documentId = identidad?.documentId ?? null
  const hero = useHeroImagen("portada_contactos", documentId, reload)

  return (
    <div className="space-y-4">
      <SeccionHero
        breadcrumb={["Operación", activo.label]}
        titulo="Contactos"
        descripcion={identidad?.descripcion_contactos || "Clientes y proveedores de medallitadeoro, en un solo lugar."}
        campoDescripcion="descripcion_contactos"
        onDescripcionGuardada={reload}
        imagenUrl={identidad?.portada_contactos?.url}
        imagenOriginalUrl={identidad?.portada_contactos_original?.url}
        documentId={documentId}
        puedeEditar={!loading}
        uploading={hero.uploading}
        inputRef={hero.inputRef}
        onTrigger={hero.trigger}
        onFileChange={hero.handleFile}
        onSaveCrop={hero.saveCrop}
      >
        <HeroTabs tabs={TABS} active={tab} onChange={setTab} />
      </SeccionHero>
      {tab === "clientes"    && <ClientesView />}
      {tab === "proveedores" && <ProveedoresView />}
    </div>
  )
}
