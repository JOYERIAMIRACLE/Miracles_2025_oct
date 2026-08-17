"use client"

import { TrendingUp, Receipt, PieChart, CreditCard, CalendarDays, UserCog, ShieldCheck, BarChart3 } from "lucide-react"
import { useSectionTab, TabBar, PageHeader, Pending } from "./shared"
import { IngresosEmpresaView } from "@/components/Empresa/Finanzas/IngresosEmpresaView"
import { GastosEmpresaView } from "@/components/Empresa/Marketing/GastosEmpresaView"
import { PresupuestosEmpresaView } from "@/components/Empresa/Finanzas/PresupuestosEmpresaView"
import { CuentasEmpresaView } from "@/components/Empresa/Finanzas/CuentasEmpresaView"
import { CalendarioPagosView } from "@/components/Empresa/Finanzas/CalendarioPagosView"
import { FinancierosView } from "@/components/Empresa/Indicadores/FinancierosView"

const TABS = [
  { id: "ingresos",     label: "Ingresos",              icon: TrendingUp },
  { id: "gastos",       label: "Gastos",                icon: Receipt },
  { id: "presupuestos", label: "Presupuestos",          icon: PieChart },
  { id: "cuentas",      label: "Cuentas",                icon: CreditCard },
  { id: "calendario",   label: "Calendario de pagos",   icon: CalendarDays },
  { id: "personas",     label: "Personas",               icon: UserCog },
  { id: "roles",        label: "Roles",                  icon: ShieldCheck },
  { id: "metricas",     label: "Métricas",                icon: BarChart3 },
]

export function SeccionAdministracionFinanzas() {
  const { tab, setTab } = useSectionTab("administracion", "ingresos")
  const activo = TABS.find(t => t.id === tab) ?? TABS[0]

  return (
    <div>
      <PageHeader title="Administración y Finanzas" breadcrumb={["Departamentos", "Administración y Finanzas", activo.label]} />
      <div className="mb-4"><TabBar tabs={TABS} active={tab} onChange={setTab} /></div>
      {tab === "ingresos"      && <IngresosEmpresaView />}
      {tab === "gastos"        && <GastosEmpresaView ambito="empresa" />}
      {tab === "presupuestos"  && <PresupuestosEmpresaView />}
      {tab === "cuentas"       && <CuentasEmpresaView />}
      {tab === "calendario"    && <CalendarioPagosView />}
      {tab === "personas"      && <Pending owner="Medallitadeoro" desc="En desarrollo, igual que hoy en gestion-empresa." />}
      {tab === "roles"         && <Pending owner="Medallitadeoro" desc="En desarrollo, igual que hoy en gestion-empresa." />}
      {tab === "metricas"      && <FinancierosView />}
    </div>
  )
}
