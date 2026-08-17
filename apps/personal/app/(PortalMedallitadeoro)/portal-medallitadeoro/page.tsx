"use client"

import { useEffect, useState } from "react"
import { PortalMDOHeader } from "@/components/Empresa/PortalMDO/PortalMDOHeader"
import { PortalMDOSidebar } from "@/components/Empresa/PortalMDO/PortalMDOSidebar"
import { SeccionPortalHome } from "@/components/Empresa/PortalMDO/SeccionPortalHome"
import { SeccionConoceMDO } from "@/components/Empresa/PortalMDO/SeccionConoceMDO"
import { SeccionMision } from "@/components/Empresa/PortalMDO/SeccionMision"
import { SeccionRH } from "@/components/Empresa/PortalMDO/SeccionRH"
import { SeccionCadenaSuministro } from "@/components/Empresa/PortalMDO/SeccionCadenaSuministro"
import { SeccionComercial } from "@/components/Empresa/PortalMDO/SeccionComercial"
import { SeccionMarketing } from "@/components/Empresa/PortalMDO/SeccionMarketing"
import { SeccionAdministracionFinanzas } from "@/components/Empresa/PortalMDO/SeccionAdministracionFinanzas"
import { SeccionSeguridad } from "@/components/Empresa/PortalMDO/SeccionSeguridad"
import { SeccionTI } from "@/components/Empresa/PortalMDO/SeccionTI"
import { TareasView } from "@/components/Personal/Tareas/TareasView"

const SECCIONES_VALIDAS = [
  "portal", "conoce", "mision", "rh", "cadena", "comercial", "marketing",
  "administracion", "seguridad", "ti", "tareas",
]

function leerHash(): { seccion: string; tab: string } {
  if (typeof window === "undefined") return { seccion: "portal", tab: "" }
  const [seccion, tab] = window.location.hash.slice(1).split("/")
  return { seccion: seccion && SECCIONES_VALIDAS.includes(seccion) ? seccion : "portal", tab: tab ?? "" }
}

export default function PortalMedallitadeoroPage() {
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
      case "portal":         return <SeccionPortalHome onNavigate={navigate} />
      case "conoce":         return <SeccionConoceMDO />
      case "mision":         return <SeccionMision />
      case "rh":             return <SeccionRH />
      case "cadena":         return <SeccionCadenaSuministro />
      case "comercial":      return <SeccionComercial />
      case "marketing":      return <SeccionMarketing />
      case "administracion": return <SeccionAdministracionFinanzas />
      case "seguridad":      return <SeccionSeguridad />
      case "ti":             return <SeccionTI />
      case "tareas":         return <TareasView ambito="empresa" titulo="Tareas" />
      default:                return <SeccionPortalHome onNavigate={navigate} />
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
        <main className="flex-1 min-w-0 p-6 text-slate-900 dark:text-slate-100">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
