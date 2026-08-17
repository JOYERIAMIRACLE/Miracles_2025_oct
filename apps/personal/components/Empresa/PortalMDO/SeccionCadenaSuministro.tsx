"use client"

import { Ship, Handshake, ShoppingCart, Truck, Boxes, Users } from "lucide-react"
import { useSectionTab, TabBar, PageHeader, Pending } from "./shared"
import { ProveedoresView } from "@/components/Empresa/Compras/ProveedoresView"
import { ComprasView } from "@/components/Empresa/Compras/ComprasView"
import { EnviosView } from "@/components/Empresa/Suministro/EnviosView"
import { InventarioEmpresaView } from "@/components/Empresa/Almacen/InventarioEmpresaView"

const TABS = [
  { id: "importacion",  label: "Importación",  icon: Ship },
  { id: "proveedores",  label: "Proveedores",   icon: Handshake },
  { id: "compras",      label: "Compras",       icon: ShoppingCart },
  { id: "logistica",    label: "Logística",     icon: Truck },
  { id: "inventario",   label: "Inventario",    icon: Boxes },
  { id: "integrantes",  label: "Integrantes",   icon: Users },
]

export function SeccionCadenaSuministro() {
  const { tab, setTab } = useSectionTab("cadena", "proveedores")
  const activo = TABS.find(t => t.id === tab) ?? TABS[0]

  return (
    <div>
      <PageHeader title="Cadena de suministro" breadcrumb={["Departamentos", "Cadena de suministro", activo.label]} />
      <div className="mb-4"><TabBar tabs={TABS} active={tab} onChange={setTab} /></div>
      {tab === "importacion" && <Pending owner="Medallitadeoro" desc="Sin contenido todavía." />}
      {tab === "proveedores" && <ProveedoresView />}
      {tab === "compras"     && <ComprasView />}
      {tab === "logistica"   && <EnviosView />}
      {tab === "inventario"  && <InventarioEmpresaView />}
      {tab === "integrantes" && <Pending owner="Medallitadeoro" desc="Todavía no existe un directorio de colaboradores." />}
    </div>
  )
}
