"use client"

import { UserCheck, Handshake } from "lucide-react"
import { useSectionTab, SeccionVitrina, ContenidoTabs, SeccionHeroContenido, useHeroImagen } from "./shared"
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
    <SeccionVitrina>
      <SeccionHeroContenido
        breadcrumb={["Operación", activo.label]}
        titulo="Contactos"
        descripcion={identidad?.descripcion_contactos || "Clientes y proveedores de medalla de oro, en un solo lugar."}
        campoDescripcion="descripcion_contactos"
        onDescripcionGuardada={reload}
        documentId={documentId}
        puedeEditar={!loading}
      >
        <ContenidoTabs tabs={TABS} active={tab} onChange={setTab} />
      </SeccionHeroContenido>
      {tab === "clientes"    && <ClientesView />}
      {tab === "proveedores" && <ProveedoresView />}
    </SeccionVitrina>
  )
}
