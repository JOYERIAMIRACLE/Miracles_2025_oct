"use client"
import { useCallback, useEffect, useState } from "react"
import { useClienteAuth } from "./useClienteAuth"
import { buscarClientePorEmail, fetchMisVentas, fetchMisCotizaciones } from "@/api/clientePortal/getMisDatos"
import { ClienteEmpresa } from "@/types/clienteEmpresa"
import { VentaEmpresa } from "@/types/ventaEmpresa"
import { Cotizacion } from "@/types/cotizacion"

export function useClientePortal() {
  const { cliente: usuario, loading: loadingAuth, logout, reload: reloadAuth } = useClienteAuth()
  const [contacto,     setContacto]     = useState<ClienteEmpresa | null>(null)
  const [ventas,       setVentas]       = useState<VentaEmpresa[]>([])
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [loading,      setLoading]      = useState(true)
  const [tick,         setTick]         = useState(0)

  const cargar = useCallback(async () => {
    if (loadingAuth) return
    if (!usuario) { setLoading(false); return }
    setLoading(true)
    try {
      const cli = await buscarClientePorEmail(usuario.email)
      setContacto(cli)
      if (cli) {
        const [v, c] = await Promise.all([fetchMisVentas(cli.documentId), fetchMisCotizaciones(cli.documentId)])
        setVentas(v)
        setCotizaciones(c)
      } else {
        setVentas([]); setCotizaciones([])
      }
    } finally {
      setLoading(false)
    }
  }, [usuario, loadingAuth])

  useEffect(() => { cargar() }, [cargar, tick])

  const ventasActivas = ventas.filter(v => v.estado !== "Cancelado")

  return {
    usuario, contacto, ventas, ventasActivas, cotizaciones,
    loading: loadingAuth || loading,
    logout,
    reload: () => { reloadAuth(); setTick(t => t + 1) },
  }
}
