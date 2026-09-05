"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronDown } from "lucide-react"
import { requestOpen, notifyClosed } from "./dropdownCoordinator"
import { useFloatingPanel } from "./useFloatingPanel"

export type DropdownOption = { value: string; label: string }

export function DropdownPicker({ options, value, onChange, label, placeholder = "—", className }: {
  options: DropdownOption[]; value: string; onChange: (v: string) => void; label: string; placeholder?: string; className?: string
}) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const id = useRef(Symbol()).current
  const floating = useFloatingPanel(ref, open)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    function handler(e: MouseEvent) {
      const t = e.target as Node
      if (ref.current && !ref.current.contains(t) && (!panelRef.current || !panelRef.current.contains(t))) {
        setOpen(false); notifyClosed(id)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => { document.removeEventListener("mousedown", handler); notifyClosed(id) }
  }, [id])

  const current = options.find(o => o.value === value)

  function toggle() {
    setOpen(v => {
      const next = !v
      if (next) requestOpen(id, () => setOpen(false))
      else notifyClosed(id)
      return next
    })
  }
  function close() { setOpen(false); notifyClosed(id) }

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button type="button" aria-label={label} onClick={toggle}
        className="w-full h-9 flex items-center gap-2 px-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-600 transition-colors shadow-sm justify-between">
        <span className="truncate">{current?.label ?? placeholder}</span>
        <ChevronDown size={13} className={`text-slate-400 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && mounted && floating && createPortal(
        <div ref={panelRef} style={{ position: "fixed", top: floating.top, left: floating.left, width: floating.width, maxHeight: floating.maxHeight }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl z-100 overflow-y-auto py-1">
          {options.map(o => (
            <button key={o.value} type="button" onClick={() => { onChange(o.value); close() }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${o.value === value ? "text-violet-600 dark:text-violet-400 font-medium bg-violet-500/5" : "text-slate-700 dark:text-slate-200"}`}>
              {o.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}

export function ComboboxPicker({ options, value, onChange, onCreateNew, label, placeholder = "—", emptyLabel }: {
  options: string[]; value: string; onChange: (v: string) => void; onCreateNew?: (v: string) => void
  label: string; placeholder?: string; emptyLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [query, setQuery] = useState("")
  const ref = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const id = useRef(Symbol()).current
  const floating = useFloatingPanel(ref, open)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    function handler(e: MouseEvent) {
      const t = e.target as Node
      if (ref.current && !ref.current.contains(t) && (!panelRef.current || !panelRef.current.contains(t))) {
        setOpen(false); notifyClosed(id)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => { document.removeEventListener("mousedown", handler); notifyClosed(id) }
  }, [id])

  const filtradas = options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
  const yaExiste = options.some(o => o.toLowerCase() === query.trim().toLowerCase())

  function toggle() {
    setOpen(v => {
      const next = !v
      if (next) { setQuery(""); requestOpen(id, () => setOpen(false)) }
      else notifyClosed(id)
      return next
    })
  }
  function close() { setOpen(false); notifyClosed(id) }

  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label={label} onClick={toggle}
        className="w-full h-9 flex items-center gap-2 px-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600 transition-colors shadow-sm justify-between">
        <span className={`truncate text-left ${value ? "text-slate-700 dark:text-slate-200" : "text-slate-400 dark:text-slate-500"}`}>{value || placeholder}</span>
        <ChevronDown size={13} className={`text-slate-400 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && mounted && floating && createPortal(
        <div ref={panelRef} style={{ position: "fixed", top: floating.top, left: floating.left, width: floating.width, maxHeight: floating.maxHeight }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl z-100 overflow-hidden flex flex-col">
          <div className="px-2 pt-2 pb-1 shrink-0">
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar..."
              className="w-full h-8 px-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 outline-none focus:border-violet-400 transition-colors" />
          </div>
          <div className="overflow-y-auto py-1">
            {emptyLabel && (
              <button type="button" onClick={() => { onChange(""); close() }}
                className={`w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${!value ? "text-violet-600 font-medium" : "text-slate-400 dark:text-slate-500"}`}>
                {emptyLabel}
              </button>
            )}
            {filtradas.map(o => (
              <button key={o} type="button" onClick={() => { onChange(o); close() }}
                className={`w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${value === o ? "text-violet-600 dark:text-violet-400 font-medium" : "text-slate-700 dark:text-slate-200"}`}>
                {o}
              </button>
            ))}
            {query.trim() && !yaExiste && (
              <button type="button" onClick={() => { const v = query.trim(); onChange(v); onCreateNew?.(v); close() }}
                className="w-full text-left px-3 py-1.5 text-sm text-violet-600 dark:text-violet-400 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
                + Usar &quot;{query.trim()}&quot;
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
