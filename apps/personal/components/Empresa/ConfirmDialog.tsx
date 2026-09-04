"use client"

// Confirmación on-brand para casos que necesitan más que un "¿Eliminar? Sí/No"
// inline (contenido dinámico/multilínea, o disparados desde un guardar/submit
// en vez de una fila) — reemplazo unificado de los distintos confirm() nativos
// que existían en Ventas y PortalMDO para este tipo de aviso.
//
// Uso desde un handler async, igual que antes con confirm():
//   if (!(await confirmDialog({ message: "..." }))) return
//
// Se monta imperativamente en un nodo aparte del DOM (como un toast) para no
// obligar a reestructurar cada call site en un modal controlado por estado —
// el único cambio en el código existente es envolver el confirm() en await.

import { useEffect } from "react"
import { createRoot } from "react-dom/client"
import { AlertTriangle } from "lucide-react"

export type ConfirmDialogOptions = {
  title?: string
  /** Una sola línea, o varias (se renderiza una por línea) — soporta "\n" o un array. */
  message: string | string[]
  confirmLabel?: string
  cancelLabel?: string
  /**
   * "danger" = pierde datos de verdad (rojo). "action" = continuar pese a un
   * aviso, sin pérdida de datos (violeta) — ej. "stock insuficiente, ¿continuar?".
   */
  variant?: "danger" | "action"
}

function ConfirmDialogUI({ options, onResolve }: {
  options: ConfirmDialogOptions
  onResolve: (value: boolean) => void
}) {
  const {
    title = options.variant === "danger" ? "Confirmar eliminación" : "Confirmar",
    message,
    confirmLabel = options.variant === "danger" ? "Eliminar" : "Continuar",
    cancelLabel = "Cancelar",
    variant = "danger",
  } = options
  const lineas = Array.isArray(message) ? message : message.split("\n")

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onResolve(false) }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onResolve])

  const confirmCls = variant === "danger"
    ? "bg-red-600 hover:bg-red-500"
    : "bg-violet-600 hover:bg-violet-500"

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog" aria-modal="true" aria-label={title}
      onClick={e => { if (e.target === e.currentTarget) onResolve(false) }}>
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-800">
          <AlertTriangle size={15} className={variant === "danger" ? "text-red-400 shrink-0" : "text-violet-400 shrink-0"} />
          <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
        </div>
        <div className="px-5 py-4 space-y-1 max-h-[50vh] overflow-y-auto">
          {lineas.map((linea, i) => linea.trim() === ""
            ? <div key={i} className="h-2" />
            : <p key={i} className="text-sm text-slate-300 leading-relaxed">{linea}</p>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-800">
          <button type="button" autoFocus onClick={() => onResolve(false)}
            className="h-8 px-4 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">
            {cancelLabel}
          </button>
          <button type="button" onClick={() => onResolve(true)}
            className={`h-8 px-4 rounded-lg text-white text-sm font-medium transition ${confirmCls}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Reemplazo de `confirm()`/`window.confirm()` — devuelve una Promise<boolean>, awaitable desde cualquier handler async. */
export function confirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
  return new Promise(resolve => {
    const container = document.createElement("div")
    document.body.appendChild(container)
    const root = createRoot(container)
    function cleanup(result: boolean) {
      root.unmount()
      container.remove()
      resolve(result)
    }
    root.render(<ConfirmDialogUI options={options} onResolve={cleanup} />)
  })
}
