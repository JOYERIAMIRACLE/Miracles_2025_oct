"use client"

import { Plus, Search, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function SuscriptoresPage() {
  // 1. HOOKS
  
  // 2. LOGS DE DESARROLLO
  if (process.env.NODE_ENV === "development") {}

  // Mapeo temporal
  const mockSuscriptores = [
    { id: 1, email: "maria@ejemplo.com", nombre: "María Silva", plan: "PRO Anual", estado: "Activo", fecha: "15 Oct 2025", aperturas: "85%", origen: "Newsletter" },
    { id: 2, email: "juan.p@ejemplo.com", nombre: "Juan Pérez", plan: "Gratuito", estado: "Inactivo", fecha: "01 Nov 2025", aperturas: "12%", origen: "Campaña IG" },
    { id: 3, email: "contacto@startup.io", nombre: "Startup IO", plan: "Premium Flex", estado: "Activo", fecha: "20 Nov 2025", aperturas: "90%", origen: "Referencia" },
  ]

  const getPlanColor = (plan: string) => {
    if(plan.includes("PRO") || plan.includes("Premium")) return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20";
    return "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700";
  }

  // 3. GUARDS
  
  // 4. RETURN PRINCIPAL
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Suscriptores</h1>
          <p className="text-sm text-zinc-500">Administra tu base de suscriptores, planes y retención.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
            <input type="text" placeholder="Buscar suscriptor..." className="pl-9 h-9 w-[200px] lg:w-[280px] rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900" />
          </div>
          <Button className="h-9 gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-full transition-all">
            <Plus className="h-4 w-4" /> Nuevo Suscriptor
          </Button>
        </div>
      </div>
      
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-sm backdrop-blur-sm overflow-hidden rounded-xl">
        <div className="relative w-full overflow-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50">
              <tr>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Suscriptor</th>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Plan & Origen</th>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Métricas (Engagement)</th>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Registro</th>
                <th className="h-11 px-5 text-left align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Estado</th>
                <th className="h-11 px-5 text-right align-middle font-medium text-zinc-500 text-xs uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {mockSuscriptores.map((sub) => (
                <tr key={sub.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40 group cursor-default">
                  <td className="p-5 align-middle">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">{sub.nombre}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{sub.email}</div>
                  </td>
                  <td className="p-5 align-middle">
                    <div className="flex flex-col items-start gap-1">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getPlanColor(sub.plan)}`}>{sub.plan}</span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">{sub.origen}</span>
                    </div>
                  </td>
                  <td className="p-5 align-middle">
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-200">{sub.aperturas}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">Tasa de Apertura</div>
                  </td>
                  <td className="p-5 align-middle text-sm text-zinc-600 dark:text-zinc-400">{sub.fecha}</td>
                  <td className="p-5 align-middle">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${sub.estado === "Activo" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"}`}>{sub.estado}</span>
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
