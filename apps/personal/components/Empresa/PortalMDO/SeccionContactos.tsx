"use client"

import { UserCheck, Handshake } from "lucide-react"
import { useSectionTab, HeroTabs, SeccionHero } from "./shared"
import { ClientesView } from "@/components/Empresa/Ventas/ClientesView"
import { ProveedoresView } from "@/components/Empresa/Compras/ProveedoresView"

const TABS = [
  { id: "clientes",    label: "Clientes",    icon: UserCheck },
  { id: "proveedores", label: "Proveedores", icon: Handshake },
]

export function SeccionContactos() {
  const { tab, setTab } = useSectionTab("contactos", "clientes")
  const activo = TABS.find(t => t.id === tab) ?? TABS[0]

  return (
    <div className="space-y-4">
      <SeccionHero
        breadcrumb={["Operación", activo.label]}
        titulo="Contactos"
        descripcion="Clientes y proveedores de medallitadeoro, en un solo lugar."
      >
        <HeroTabs tabs={TABS} active={tab} onChange={setTab} />
      </SeccionHero>
      {tab === "clientes"    && <ClientesView />}
      {tab === "proveedores" && <ProveedoresView />}
    </div>
  )
}
