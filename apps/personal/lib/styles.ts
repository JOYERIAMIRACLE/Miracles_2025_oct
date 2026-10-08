export const fieldCls = "w-full h-9 px-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-violet-400 dark:focus:border-violet-500 focus:ring-2 focus:ring-violet-300/40 dark:focus:ring-violet-500/30 transition-colors shadow-sm"

// Tablas del Portal: el estilo de Inventario › Compras, en un solo lugar.
// En oscuro el encabezado y el hover aclaran con blanco translúcido, porque
// la tarjeta ya es #2a1b3d y repetir ese color no se notaría.
const thBase = "h-10 px-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap"
export const tablaCls = {
  marco:    "bg-white dark:bg-[#2a1b3d] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden",
  scroll:   "overflow-x-auto",
  tabla:    "w-full text-sm",
  thead:    "border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-white/3",
  th:       `${thBase} text-left`,
  thDer:    `${thBase} text-right`,
  thCentro: `${thBase} text-center`,
  tbody:    "divide-y divide-slate-100 dark:divide-slate-800/60",
  fila:     "transition-colors hover:bg-slate-50 dark:hover:bg-white/4",
  td:       "px-4 py-3 tabular-nums",
  skeleton: "h-4 rounded bg-slate-100 dark:bg-white/6 animate-pulse w-3/4",
}
