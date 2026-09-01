"use client"

import { useEffect, useState } from "react"
import { PortalMDOHeader } from "@/components/Empresa/PortalMDO/PortalMDOHeader"
import { PortalMDOSidebar } from "@/components/Empresa/PortalMDO/PortalMDOSidebar"
import { SeccionPortalHome } from "@/components/Empresa/PortalMDO/SeccionPortalHome"
import { SeccionConoceMDO } from "@/components/Empresa/PortalMDO/SeccionConoceMDO"
import { SeccionMision } from "@/components/Empresa/PortalMDO/SeccionMision"
import { SeccionContactos } from "@/components/Empresa/PortalMDO/SeccionContactos"
import { SeccionVentas } from "@/components/Empresa/PortalMDO/SeccionVentas"
import { SeccionInventario } from "@/components/Empresa/PortalMDO/SeccionInventario"
import { SeccionCampanas } from "@/components/Empresa/PortalMDO/SeccionCampanas"
import { SeccionSitioWeb } from "@/components/Empresa/PortalMDO/SeccionSitioWeb"
import { SeccionFinanzas } from "@/components/Empresa/PortalMDO/SeccionFinanzas"
import { SeccionDocumentos } from "@/components/Empresa/PortalMDO/SeccionDocumentos"
import { SeccionGestionMarca } from "@/components/Empresa/PortalMDO/SeccionGestionMarca"
import { SeccionEnlaces } from "@/components/Empresa/PortalMDO/SeccionEnlaces"
import { TareasView } from "@/components/Personal/Tareas/TareasView"
import { NotasMejora } from "@/components/Empresa/PortalMDO/NotasMejora"

const SECCIONES_VALIDAS = [
  "portal", "conoce", "mision",
  "tareas", "campanas", "contactos", "ventas", "inventario", "finanzas", "sitio-web",
  "documentos", "marca", "enlaces",
]

function leerHash(): { seccion: string; tab: string } {
  if (typeof window === "undefined") return { seccion: "portal", tab: "" }
  const [seccion, tab] = window.location.hash.slice(1).split("/")
  return { seccion: seccion && SECCIONES_VALIDAS.includes(seccion) ? seccion : "portal", tab: tab ?? "" }
}

export default function PortalMedalladeoroPage() {
  const [seccion, setSeccion]         = useState("portal")
  const [tab, setTabState]            = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const inicial = leerHash()
    setSeccion(inicial.seccion)
    setTabState(inicial.tab)

    function onHashChange() {
      const actual = leerHash()
      setSeccion(actual.seccion)
      setTabState(actual.tab)
    }
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  function navigate(id: string, tabDestino?: string) {
    setSeccion(id)
    setTabState(tabDestino ?? "")
    window.location.hash = tabDestino ? `${id}/${tabDestino}` : id
  }

  function renderContent() {
    switch (seccion) {
      case "portal":      return <SeccionPortalHome onNavigate={navigate} />
      case "conoce":       return <SeccionConoceMDO />
      case "mision":       return <SeccionMision />
      case "tareas":       return <TareasView ambito="empresa" titulo="Tareas" breadcrumb={["Operación", "Tareas"]} />
      case "campanas":     return <SeccionCampanas />
      case "contactos":    return <SeccionContactos />
      case "ventas":       return <SeccionVentas />
      case "inventario":   return <SeccionInventario />
      case "finanzas":     return <SeccionFinanzas />
      case "sitio-web":    return <SeccionSitioWeb />
      case "documentos":   return <SeccionDocumentos />
      case "marca":        return <SeccionGestionMarca />
      case "enlaces":      return <SeccionEnlaces />
      default:              return <SeccionPortalHome onNavigate={navigate} />
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <PortalMDOHeader onMenuClick={() => setSidebarOpen(o => !o)} onLogoClick={() => navigate("portal")} onNavigate={navigate} />

      <div className="flex min-h-[calc(100vh-56px)]">
        {sidebarOpen && (
          <>
            <div className="fixed inset-0 top-14 z-30 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
            <PortalMDOSidebar seccion={seccion} tab={tab} onNavigate={navigate} />
          </>
        )}
        <main className="flex-1 min-w-0 p-6 text-slate-900 dark:text-slate-100 relative">
          {renderContent()}
          <NotasMejora onNavigate={navigate} />
        </main>
      </div>
    </div>
  )
}
