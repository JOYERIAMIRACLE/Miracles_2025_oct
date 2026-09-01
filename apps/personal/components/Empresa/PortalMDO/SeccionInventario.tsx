"use client"

import { Boxes, Scale, Truck, BookOpen } from "lucide-react"
import { useSectionTab, HeroTabs, SeccionHero } from "./shared"
import { InventarioEmpresaView } from "@/components/Empresa/Almacen/InventarioEmpresaView"
import { MateriaPrimaView } from "@/components/Empresa/Compras/MateriaPrimaView"
import { EnviosView } from "@/components/Empresa/Suministro/EnviosView"
import { CatalogoJoyeriaView } from "@/components/Empresa/Suministro/CatalogoJoyeriaView"

const TABS = [
  { id: "materiaprima", label: "Compras",   icon: Scale    },
  { id: "productos",    label: "Productos", icon: Boxes    },
  { id: "catalogo",     label: "Catálogo",  icon: BookOpen },
  { id: "logistica",    label: "Logística", icon: Truck    },
]

export function SeccionInventario() {
  const { tab, setTab } = useSectionTab("inventario", "materiaprima")
  const activo = TABS.find(t => t.id === tab) ?? TABS[0]

  return (
    <div className="space-y-4">
      <SeccionHero
        breadcrumb={["Operación", "Inventario", activo.label]}
        titulo="Inventario"
        descripcion="Compras, producto terminado, catálogo de SKUs y logística."
      >
        <HeroTabs tabs={TABS} active={tab} onChange={setTab} />
      </SeccionHero>
      {tab === "materiaprima" && <MateriaPrimaView />}
      {tab === "productos"    && <InventarioEmpresaView />}
      {tab === "catalogo"     && <CatalogoJoyeriaView />}
      {tab === "logistica"    && <EnviosView />}
    </div>
  )
}
