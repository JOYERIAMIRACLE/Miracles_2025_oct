"use client"

import { useEffect, useState, type RefObject } from "react"

export type FloatingRect = { top: number; left: number; width: number; maxHeight: number }

// Calcula la posición del panel en coordenadas de viewport (position: fixed)
// a partir del botón disparador, para poder pintarlo con un portal directo a
// document.body. Así el panel nunca se recorta contra el overflow-hidden/auto
// de una card, modal o sección colapsable — sale "hacia afuera" siempre.
export function useFloatingPanel(triggerRef: RefObject<HTMLElement | null>, open: boolean): FloatingRect | null {
  const [rect, setRect] = useState<FloatingRect | null>(null)

  useEffect(() => {
    if (!open) { setRect(null); return }

    function update() {
      const el = triggerRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const espacioAbajo = window.innerHeight - r.bottom - 12
      setRect({ top: r.bottom + 6, left: r.left, width: r.width, maxHeight: Math.max(160, espacioAbajo) })
    }

    update()
    window.addEventListener("scroll", update, true)
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update, true)
      window.removeEventListener("resize", update)
    }
  }, [open, triggerRef])

  return rect
}
