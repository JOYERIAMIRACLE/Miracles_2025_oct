"use client"

import { FileText, ShoppingBag } from "lucide-react"
import { useSectionTab, TabBar, SeccionHero } from "./shared"
import { CotizacionesView } from "@/components/Empresa/Ventas/CotizacionesView"
import { PedidosView } from "@/components/Empresa/Ventas/PedidosView"

const TABS = [
  { id: "cotizaciones", label: "Cotizaciones", icon: FileText },
  { id: "pedidos",      label: "Pedidos",       icon: ShoppingBag },
]

export function SeccionVentas() {
  const { tab, setTab } = useSectionTab("ventas", "cotizaciones")
  const activo = TABS.find(t => t.id === tab) ?? TABS[0]

  return (
    <div className="space-y-4">
      <SeccionHero
        breadcrumb={["Operación", "Ventas", activo.label]}
        titulo="Ventas"
        descripcion="Cotizaciones y pedidos — de la oferta al pedido confirmado."
      />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      {tab === "cotizaciones" && <CotizacionesView />}
      {tab === "pedidos"      && <PedidosView />}
    </div>
  )
}
