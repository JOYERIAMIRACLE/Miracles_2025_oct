"use client"

import { useEffect, useState } from "react"
import { PortalMDOHeader } from "@/components/Empresa/PortalMDO/PortalMDOHeader"
import { PortalMDOSidebar } from "@/components/Empresa/PortalMDO/PortalMDOSidebar"
import { SeccionPortalHome } from "@/components/Empresa/PortalMDO/SeccionPortalHome"
import { PortalHomeHero } from "@/components/Empresa/PortalMDO/PortalHomeHero"
import { TareasHeroFondo } from "@/components/Empresa/PortalMDO/TareasHeroFondo"
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
import { SeccionPanel } from "@/components/Empresa/PortalMDO/SeccionPanel"

const SECCIONES_VALIDAS = [
  "portal", "conoce", "mision",
  "panel",
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
      case "panel":        return <SeccionPanel />
      case "portal":      return <SeccionPortalHome onNavigate={navigate} />
      case "conoce":       return <SeccionConoceMDO />
      case "mision":       return <SeccionMision />
      case "tareas":       return <TareasView ambito="empresa" titulo="Tareas" breadcrumb={["Operación", "Tareas"]} heroExterno />
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
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#08091a]">
      <PortalMDOHeader onMenuClick={() => setSidebarOpen(o => !o)} onLogoClick={() => navigate("portal")} onNavigate={navigate} />

      <div className="flex min-h-[calc(100vh-56px)]">
        {sidebarOpen && (
          <>
            <div className="fixed inset-0 top-14 z-30 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
            <PortalMDOSidebar seccion={seccion} tab={tab} onNavigate={navigate} />
          </>
        )}
        <main className={`flex-1 min-w-0 text-slate-900 dark:text-slate-100 relative overflow-x-hidden ${
          seccion === "tareas" ? "bg-[#f8f9fa] dark:bg-[#121212]" : ""
        }`}>
          {/* Atmospheric dark gradient — solo dark mode */}
          <div className="pointer-events-none absolute inset-0 hidden dark:block"
            style={{background:"radial-gradient(ellipse 90% 50% at 50% 0%, #2a1b3d33 0%, transparent 65%)"}}/>
          {/* ─── EXCEPCIÓN al boxed layout: el hero de Inicio vive AFUERA del
              container de abajo, a todo el ancho de <main> (hasta el sidebar),
              para que el mural llegue a las orillas reales de la pantalla.
              Es la única sección que rompe la regla — ver PortalHomeHero.tsx.
              El resto de Inicio (y todas las demás secciones) siguen boxed. ─── */}
          {seccion === "portal" && <PortalHomeHero />}
          {/* Mismo mecanismo de excepción que el hero de Inicio: el fondo de
              Tareas (foto + overlay + ⋮) vive full-bleed, afuera del boxed
              container de abajo — ver TareasHeroFondo.tsx. El breadcrumb/
              título/descripción/tabs de Tareas siguen boxed, dentro de
              TareasView (SeccionHeroContenido). */}
          {seccion === "tareas" && <TareasHeroFondo />}
          {/* ─── LAYOUT RULE: Boxed/Contained ─────────────────────────────────
              Todo el contenido del portal vive dentro de este container.
              max-w-7xl = 1280px máximo, centrado con mx-auto.
              No usar full-width en secciones individuales fuera de este wrapper.
              ─────────────────────────────────────────────────────────────── */}
          <div className="max-w-7xl mx-auto px-6 py-6 w-full relative z-10">
            {renderContent()}
          </div>
          <NotasMejora onNavigate={navigate} />
        </main>
      </div>
    </div>
  )
}
