"use client"

import { TrendingUp, Receipt, PieChart, CreditCard, CalendarDays, BarChart3, Gavel } from "lucide-react"
import { useSectionTab, TabBar, SeccionHero, useHeroImagen } from "./shared"
import { useGetIdentidad } from "@/api/identidad-empresa/getIdentidad"
import { IngresosEmpresaView } from "@/components/Empresa/Finanzas/IngresosEmpresaView"
import { GastosEmpresaView } from "@/components/Empresa/Finanzas/GastosEmpresaView"
import { PresupuestosEmpresaView } from "@/components/Empresa/Finanzas/PresupuestosEmpresaView"
import { CuentasEmpresaView } from "@/components/Empresa/Finanzas/CuentasEmpresaView"
import { CalendarioPagosView } from "@/components/Empresa/Finanzas/CalendarioPagosView"
import { FinancierosView } from "@/components/Empresa/Indicadores/FinancierosView"
import { DocumentosLegalesView } from "./DocumentosLegalesView"

const TABS = [
  { id: "ingresos",     label: "Ingresos",              icon: TrendingUp },
  { id: "gastos",       label: "Gastos",                icon: Receipt },
  { id: "presupuestos", label: "Presupuestos",          icon: PieChart },
  { id: "cuentas",      label: "Cuentas",                icon: CreditCard },
  { id: "calendario",   label: "Calendario de pagos",   icon: CalendarDays },
  { id: "legales",      label: "Documentos legales",    icon: Gavel },
  { id: "metricas",     label: "Métricas",                icon: BarChart3 },
]

export function SeccionAdministracionFinanzas() {
  const { tab, setTab } = useSectionTab("administracion", "ingresos")
  const activo = TABS.find(t => t.id === tab) ?? TABS[0]
  const { identidad, loading, reload } = useGetIdentidad()
  const documentId = identidad?.documentId ?? null
  const hero = useHeroImagen("portada_depto_administracion", documentId, reload)

  return (
    <div className="space-y-4">
      <SeccionHero
        breadcrumb={["Departamentos", "Administración y Finanzas", activo.label]}
        titulo="Administración y Finanzas"
        descripcion={identidad?.descripcion_depto_administracion || "Ingresos, gastos, presupuestos, cuentas y documentos legales de medallitadeoro."}
        campoDescripcion="descripcion_depto_administracion"
        onDescripcionGuardada={reload}
        imagenUrl={identidad?.portada_depto_administracion?.url}
        imagenOriginalUrl={identidad?.portada_depto_administracion_original?.url}
        documentId={documentId}
        puedeEditar={!loading}
        uploading={hero.uploading}
        inputRef={hero.inputRef}
        onTrigger={hero.trigger}
        onFileChange={hero.handleFile}
        onSaveCrop={hero.saveCrop}
      />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      {tab === "ingresos"      && <IngresosEmpresaView />}
      {tab === "gastos"        && <GastosEmpresaView ambito="empresa" />}
      {tab === "presupuestos"  && <PresupuestosEmpresaView />}
      {tab === "cuentas"       && <CuentasEmpresaView />}
      {tab === "calendario"    && <CalendarioPagosView />}
      {tab === "legales"       && <DocumentosLegalesView />}
      {tab === "metricas"      && <FinancierosView />}
    </div>
  )
}
