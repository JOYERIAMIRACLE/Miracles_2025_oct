"use client"

import { Plus, Search, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function SociosComercialesPage() {
  // 1. HOOKS
  
  // 2. LOGS
  if (process.env.NODE_ENV === "development") {}

  const mockSocios = [
    { id: 1, empresa: "Logística Express", contacto: "Roberto Gómez (Dir. Operaciones)", telefono: "555-9001", email: "rgomez@logistica.com", tipo: "Proveedor Estratégico", condicion: "Net 30", estado: "Activo" },
    { id: 2, empresa: "Agencia Creative", contacto: "Ana Ruiz (Marketing)", telefono: "555-8822", email: "ana@creative.io", tipo: "Afiliado", condicion: "15% Comisión", estado: "Activo" },
    { id: 3, empresa: "Tech Parts Import", contacto: "Carlos Mendoza", telefono: "555-1100", email: "ventas@techparts.com", tipo: "Distribuidor Externo", condicion: "Net 15", estado: "En revisión" },
  ]

  const getTipoColor = (tipo: string) => {
    switch(tipo) {
      case "Proveedor Estratégico": return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20";
      case "Afiliado": return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
      default: return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
    }
  }

  // 3. GUARDS
  
  // 4. RETURN
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Socios Comerciales</h1>
          <p className="text-sm text-zinc-500">Administra distribuidores, proveedores y aliados estratégicos.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
            <input type="text" placeholder="Buscar socio..." className="pl-9 h-9 w-[200px] lg:w-[280px] rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900" />
          </div>
          <Button className="h-9 gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-full transition-all">
            <Plus className="h-4 w-4" /> Nuevo Socio
          </Button>
        </div>
      </div>
      
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-sm backdrop-blur-sm overflow-hidden rounded-xl">
        <div className="relative w-full overflow-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50">
              <tr>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Empresa (Socio)</th>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Punto de Contacto</th>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Alineación / Tipo</th>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Términos</th>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Estado</th>
                <th className="h-11 px-5 text-right align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {mockSocios.map((socio) => (
                <tr key={socio.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40 group cursor-default">
                  <td className="p-5 align-middle">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">{socio.empresa}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">{String(socio.id).padStart(4, 'S-000')}</div>
                  </td>
                  <td className="p-5 align-middle">
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-200">{socio.contacto}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{socio.email} • {socio.telefono}</div>
                  </td>
                  <td className="p-5 align-middle">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getTipoColor(socio.tipo)}`}>{socio.tipo}</span>
                  </td>
                  <td className="p-5 align-middle">
                     <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/50 uppercase tracking-wider">{socio.condicion}</span>
                  </td>
                  <td className="p-5 align-middle">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${socio.estado === "Activo" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"}`}>{socio.estado}</span>
                  </td>
                  <td className="p-5 align-middle text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
