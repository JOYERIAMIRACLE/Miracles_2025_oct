import { EstadoVenta } from "@/types/ventaEmpresa"
import { EstadoCotizacion } from "@/types/cotizacion"

// Colores propios para el portal de cliente — los del CRM interno usan
// violeta (acento del Portal de staff); aquí se queda en ámbar/neutro para
// no mezclar la identidad de marca de la Tienda con la del Portal.
export const ESTADO_TIENDA: Record<EstadoVenta, string> = {
  Cotizado:   "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-zinc-700",
  Pagado:     "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  Preparando: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  Enviado:    "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  Entregado:  "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  Cancelado:  "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
}

export const ESTADO_COT_TIENDA: Record<EstadoCotizacion, string> = {
  Borrador:   "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-zinc-700",
  Enviada:    "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  Aceptada:   "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  Rechazada:  "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  Convertida: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
}

export function fmtDtCorta(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })
}
