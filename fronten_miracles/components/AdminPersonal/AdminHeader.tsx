"use client"

import { usePathname } from "next/navigation"

export function AdminHeader() {
  // 1. HOOKS
  const pathname = usePathname()

  // Generador dinámico de título usando la ruta
  const generateTitle = () => {
    if (!pathname || pathname === "/gestion-personal") return "Dashboard de Inicio"
    
    // Obtenemos el último segmento de la URL
    const parts = pathname.split("/").filter(Boolean)
    const lastPart = parts[parts.length - 1]
    
    // Lo limpiamos (ej: "centros-costos" -> "Centros Costos")
    return lastPart
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }

  const title = generateTitle()

  // 2. LOGS DE DESARROLLO
  if (process.env.NODE_ENV === "development") {
    // console.log("Header Title:", title)
  }

  // 3. GUARDS
  // N/A

  // 4. RETURN PRINCIPAL
  return (
    <header className="h-16 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        {/* Espacio para menú de usuario (Avatar) futuro */}
        <div className="h-9 w-9 rounded-full bg-zinc-900 text-white flex items-center justify-center text-sm font-semibold shadow border border-zinc-800">
          RR
        </div>
      </div>
    </header>
  )
}
