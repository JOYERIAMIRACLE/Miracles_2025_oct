"use client"
import { useCurrentUser } from "@/lib/useCurrentUser"
import { NotasMejora } from "@/components/Empresa/PortalMDO/NotasMejora"

// Mismo widget de pines de feedback que ya existe en el Portal — se reusa
// tal cual, sin re-escribirlo. La Tienda es pública y no tiene su propio
// login, así que aquí solo se activa si el navegador ya trae una sesión
// del Portal (mismo dominio, mismo localStorage) — un cliente anónimo
// nunca ve los botones. Punto de partida simple: cuando la Tienda tenga
// su propia cuenta de "equipo", esto se puede afinar a un permiso real.
export function NotasMejoraTienda() {
  const { user, loading } = useCurrentUser()
  if (loading || !user) return null
  return <NotasMejora />
}
