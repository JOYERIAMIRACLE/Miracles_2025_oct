"use client"

import { FileText, ShoppingBag, Truck } from "lucide-react"
import { useSectionTab, TabBar, SeccionHero } from "./shared"
import { CotizacionesView } from "@/components/Empresa/Ventas/CotizacionesView"
import { PedidosView } from "@/components/Empresa/Ventas/PedidosView"
import { EnviosView } from "@/components/Empresa/Suministro/EnviosView"

const TABS = [
  { id: "cotizaciones", label: "Cotizaciones", icon: FileText },
  { id: "pedidos",      label: "Pedidos",       icon: ShoppingBag },
  { id: "envios",       label: "Envíos",        icon: Truck },
]

export function SeccionVentas() {
  const { tab, setTab } = useSectionTab("ventas", "cotizaciones")
  const activo = TABS.find(t => t.id === tab) ?? TABS[0]

  return (
    <div className="space-y-4">
      <SeccionHero
        breadcrumb={["Operación", "Ventas", activo.label]}
        titulo="Ventas"
        descripcion="Cotizaciones, pedidos y su envío — de la oferta a la entrega."
      />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      {tab === "cotizaciones" && <CotizacionesView />}
      {tab === "pedidos"      && <PedidosView />}
      {tab === "envios"       && <EnviosView />}
    </div>
  )
}
