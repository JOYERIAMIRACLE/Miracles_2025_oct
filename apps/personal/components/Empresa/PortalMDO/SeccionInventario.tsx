"use client"

import { Boxes, Scale, Truck } from "lucide-react"
import { useSectionTab, TabBar, SeccionHero } from "./shared"
import { InventarioEmpresaView } from "@/components/Empresa/Almacen/InventarioEmpresaView"
import { MateriaPrimaView } from "@/components/Empresa/Compras/MateriaPrimaView"
import { EnviosView } from "@/components/Empresa/Suministro/EnviosView"

const TABS = [
  { id: "productos",    label: "Productos",     icon: Boxes },
  { id: "materiaprima", label: "Materia prima", icon: Scale },
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
        descripcion="Producto terminado, materia prima y su logística de envío."
      />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      {tab === "productos"    && <InventarioEmpresaView />}
      {tab === "materiaprima" && <MateriaPrimaView />}
      {tab === "logistica"    && <EnviosView />}
    </div>
  )
}
