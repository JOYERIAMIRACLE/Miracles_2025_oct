"use client"

import { Boxes, Scale, Truck } from "lucide-react"
import { useSectionTab, HeroTabs, SeccionHero } from "./shared"
import { InventarioEmpresaView } from "@/components/Empresa/Almacen/InventarioEmpresaView"
import { MateriaPrimaView } from "@/components/Empresa/Compras/MateriaPrimaView"
import { EnviosView } from "@/components/Empresa/Suministro/EnviosView"

const TABS = [
  { id: "productos",    label: "Productos",     icon: Boxes },
  { id: "materiaprima", label: "Compras",       icon: Scale },
  { id: "logistica",    label: "Logística",     icon: Truck },
]

export function SeccionInventario() {
  const { tab, setTab } = useSectionTab("inventario", "productos")
  const activo = TABS.find(t => t.id === tab) ?? TABS[0]

  return (
    <div className="space-y-4">
      <SeccionHero
        breadcrumb={["Operación", "Inventario", activo.label]}
        titulo="Inventario"
        descripcion="Producto terminado, compras de material y su logística de envío."
      >
        <HeroTabs tabs={TABS} active={tab} onChange={setTab} />
      </SeccionHero>
      {tab === "productos"    && <InventarioEmpresaView />}
      {tab === "materiaprima" && <MateriaPrimaView />}
      {tab === "logistica"    && <EnviosView />}
    </div>
  )
}
