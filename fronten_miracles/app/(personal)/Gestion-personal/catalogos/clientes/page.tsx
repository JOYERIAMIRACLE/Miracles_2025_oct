"use client"

import { Plus, Search, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function ClientesPage() {
  // 1. HOOKS
  
  // 2. LOGS DE DESARROLLO
  if (process.env.NODE_ENV === "development") {
    // console.log("Cargando vista del Catálogo de Clientes")
  }

  // Mapeo temporal (Mock Data) con canal y origen agregados
  const mockClientes = [
    { 
      id: 1, 
      nombre: "Empresa Alpha S.A", 
      email: "contacto@alpha.com", 
      telefono: "555-0123", 
      direccion: "Av. Reforma 222, CDMX",
      segmento: "B2B Corporativo",
      funnel: "Negociación",
      canalContacto: "WhatsApp",
      origenContacto: "Campaña Meta Ads",
      pedidos: 12,
      cotizaciones: 5,
      estado: "Activo" 
    },
    { 
      id: 2, 
      nombre: "Innovaciones Zeta", 
      email: "info@zeta.com", 
      telefono: "555-4567", 
      direccion: "San Pedro Garza Garcia 4A, N.L.",
      segmento: "B2B Pyme",
      funnel: "Prospecto",
      canalContacto: "Correo Web",
      origenContacto: "Búsqueda Orgánica",
      pedidos: 0,
      cotizaciones: 2,
      estado: "Inactivo" 
    },
    { 
      id: 3, 
      nombre: "Distribuidora Gamma", 
      email: "ventas@gamma.net", 
      telefono: "555-8901",
      direccion: "Calle Madero 18, GDL",
      segmento: "B2B Corporativo",
      funnel: "Cliente",
      canalContacto: "Llamada Telefónica",
      origenContacto: "Recomendación",
      pedidos: 45,
      cotizaciones: 10,
      estado: "Activo" 
    },
  ]

  // Helper para asignar colores hermosos a las etiquetas del Funnel
  const getFunnelColor = (estado: string) => {
    switch(estado) {
      case "Prospecto": return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
      case "Negociación": return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      case "Cliente": return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      default: return "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700";
    }
  }

  // 3. GUARDS
  
  // 4. RETURN PRINCIPAL
  return (
    <div className="space-y-6">
      {/* Encabezado y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Clientes</h1>
          <p className="text-sm text-zinc-500">Administra tu cartera de clientes, su embudo y métodos de adquisición.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar cliente..." 
              className="pl-9 h-9 w-[200px] lg:w-[280px] rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-transparent dark:border-zinc-800 dark:bg-zinc-900" 
            />
          </div>
          <Button className="h-9 gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-500/20 rounded-full transition-all">
            <Plus className="h-4 w-4" />
            Nuevo Cliente
          </Button>
        </div>
      </div>
      
      {/* Tabla Premium Resumida */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-sm backdrop-blur-sm overflow-hidden rounded-xl">
        <div className="relative w-full overflow-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50">
              <tr>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Cliente</th>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Info. Contacto</th>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Dirección de Envío</th>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Adquisición</th>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Clasificación</th>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Métricas</th>
                <th className="h-11 px-5 text-right align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {mockClientes.map((cliente) => (
                <tr 
                  key={cliente.id} 
                  className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40 group cursor-default"
                >
                  {/* Columna 1: Nombre y Email */}
                  <td className="p-5 align-middle">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">{cliente.nombre}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{cliente.email}</div>
                  </td>
                  
                  {/* Columna 2: Info. Contacto (Teléfono) */}
                  <td className="p-5 align-middle">
                    <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{cliente.telefono}</div>
                  </td>

                  {/* Columna 3: Dirección de Envío */}
                  <td className="p-5 align-middle">
                    <div className="text-sm text-zinc-600 dark:text-zinc-400 truncate max-w-[150px]" title={cliente.direccion}>
                      {cliente.direccion}
                    </div>
                  </td>

                  {/* Columna 4: Canal y Origen (Nueva Columna) */}
                  <td className="p-5 align-middle">
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-200">{cliente.canalContacto}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[120px]">{cliente.origenContacto}</span>
                    </div>
                  </td>
                  
                  {/* Columna 5: Segmento y Funnel */}
                  <td className="p-5 align-middle">
                    <div className="flex flex-col items-start gap-1.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getFunnelColor(cliente.funnel)}`}>
                        {cliente.funnel}
                      </span>
                      <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 uppercase tracking-wider">
                        {cliente.segmento}
                      </span>
                    </div>
                  </td>
                  
                  {/* Columna 6: Actividad y Estado General */}
                  <td className="p-5 align-middle">
                    <div className="flex flex-col gap-1 items-start">
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                         <span className="font-bold text-zinc-900 dark:text-zinc-100">{cliente.pedidos}</span> Ped
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                         <span className="font-bold text-zinc-900 dark:text-zinc-100">{cliente.cotizaciones}</span> Cotiz
                      </div>
                    </div>
                  </td>
                  
                  {/* Columna 7: Acciones */}
                  <td className="p-5 align-middle text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {mockClientes.length === 0 && (
            <div className="py-12 text-center text-zinc-500">
              No hay clientes registrados en el sistema.
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
