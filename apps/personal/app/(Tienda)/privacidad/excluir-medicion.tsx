"use client"

import { useEffect, useState } from "react"

const CLAVE = "mdo_no_track"

// Permite a cualquier persona dejar de ser medida en este navegador (lib/medicion.ts
// respeta esta marca además de la señal "No rastrear" del navegador).
export function ExcluirMedicion() {
  const [excluido, setExcluido] = useState(false)
  const [listo, setListo] = useState(false)

  useEffect(() => {
    try { setExcluido(localStorage.getItem(CLAVE) === "1") } catch { /* almacenamiento bloqueado */ }
    setListo(true)
  }, [])

  function alternar() {
    const nuevo = !excluido
    try {
      if (nuevo) localStorage.setItem(CLAVE, "1")
      else localStorage.removeItem(CLAVE)
      setExcluido(nuevo)
    } catch { /* almacenamiento bloqueado */ }
  }

  if (!listo) return null
  return (
    <button
      type="button"
      onClick={alternar}
      className="mt-3 rounded-lg border border-violet-300 dark:border-violet-800 px-4 py-2 text-sm font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
    >
      {excluido ? "Volver a permitir la medición en este navegador" : "No medir mi navegación en este navegador"}
    </button>
  )
}
