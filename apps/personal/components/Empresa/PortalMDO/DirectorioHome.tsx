"use client"
import { useMemo, useState } from "react"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import type { ColaboradorType } from "@/types/colaborador"
import { Card, AvatarColab, ColumnHeading } from "./shared"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownPicker } from "@/components/Shared/DropdownPicker"

const POR_PAGINA = 6

/**
 * Portado de sdi-portal/components/Trabajo/portal/DirectorioHome.tsx —
 * directorio compacto para Inicio, reusa el mismo `colaboradores` que ya
 * trae SeccionPortalHome (sin fetch propio). Búsqueda por nombre/puesto +
 * filtro por área (DropdownPicker, no <select> nativo) + paginado simple.
 * Badge de área en violeta en vez de naranja (regla de un solo acento).
 */
export function DirectorioHome({ colaboradores, loading }: { colaboradores: ColaboradorType[]; loading: boolean }) {
  const [busqueda, setBusqueda] = useState("")
  const [area, setArea]         = useState("")
  const [pagina, setPagina]     = useState(0)

  const areas = useMemo(() => {
    const set = new Set<string>()
    colaboradores.forEach(c => { if (c.area) set.add(c.area) })
    return [...set].sort((a, b) => a.localeCompare(b, "es"))
  }, [colaboradores])

  const busq = busqueda.toLowerCase().trim()
  const filtrados = colaboradores
    .filter(c => !area || c.area === area)
    .filter(c => !busq || c.nombre.toLowerCase().includes(busq) || (c.puesto ?? "").toLowerCase().includes(busq))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))

  const totalPaginas  = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const paginaSegura  = Math.min(pagina, totalPaginas - 1)
  const visibles      = filtrados.slice(paginaSegura * POR_PAGINA, paginaSegura * POR_PAGINA + POR_PAGINA)

  function actualizarBusqueda(v: string) { setBusqueda(v); setPagina(0) }
  function actualizarArea(v: string) { setArea(v); setPagina(0) }

  return (
    <div>
      <div className="mb-3"><ColumnHeading>Directorio</ColumnHeading></div>
      <Card className="!p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Buscar por nombre o puesto…" value={busqueda}
              onChange={e => actualizarBusqueda(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
          </div>
          <DropdownPicker className="sm:w-48" label="Área" value={area} onChange={actualizarArea} placeholder="Todas las áreas"
            options={[{ value: "", label: "Todas las áreas" }, ...areas.map(a => ({ value: a, label: a }))]} />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 p-2">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-2.5 w-12 rounded" />
              </div>
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">Sin resultados</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {visibles.map(c => (
                <div key={c.documentId} className="flex flex-col items-center text-center gap-1 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <AvatarColab colaborador={c} size="md" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate w-full">{c.nombre}</p>
                  {c.puesto && <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate w-full">{c.puesto}</p>}
                  {c.area && <span className="text-[9px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-medium mt-0.5 truncate max-w-full">{c.area}</span>}
                </div>
              ))}
            </div>
            {totalPaginas > 1 && (
              <div className="flex items-center justify-center gap-3 pt-1">
                <button type="button" aria-label="Página anterior" disabled={paginaSegura === 0}
                  onClick={() => setPagina(p => p - 1)}
                  className="h-6 w-6 rounded flex items-center justify-center text-slate-400 hover:text-violet-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:pointer-events-none">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Página {paginaSegura + 1} de {totalPaginas}</span>
                <button type="button" aria-label="Página siguiente" disabled={paginaSegura >= totalPaginas - 1}
                  onClick={() => setPagina(p => p + 1)}
                  className="h-6 w-6 rounded flex items-center justify-center text-slate-400 hover:text-violet-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:pointer-events-none">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
