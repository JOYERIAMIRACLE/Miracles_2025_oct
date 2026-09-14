"use client"

import { useState, useEffect } from "react"

const STORAGE_KEY = "aviso_privacidad_v1"

interface Props {
  urlAviso?: string   // URL a la página completa del aviso de privacidad
  empresa?: string
}

export function AvisoPrivacidadBanner({ urlAviso = "/aviso-de-privacidad", empresa = "Medalla de Oro" }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
    } catch { setVisible(true) }
  }, [])

  function aceptar() {
    try { localStorage.setItem(STORAGE_KEY, new Date().toISOString()) } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Aviso de privacidad"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="mx-auto max-w-2xl rounded-2xl shadow-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 px-5 py-4"
        style={{
          background: "#0e1530",
          border: "1px solid #1c2545",
          pointerEvents: "all",
        }}
      >
        {/* Texto */}
        <p className="flex-1 text-[13px] text-slate-300 leading-snug">
          <span className="font-semibold text-white">{empresa}</span> usa únicamente cookies
          esenciales de sesión anónima para medir el tráfico web. No almacenamos datos personales
          sin tu consentimiento.{" "}
          <a
            href={urlAviso}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-violet-400 hover:text-violet-300 transition-colors"
          >
            Leer aviso de privacidad
          </a>
        </p>

        {/* Botones */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={aceptar}
            className="px-4 py-2 rounded-xl text-[13px] font-semibold transition-all"
            style={{ background: "#9b82d4", color: "#fff" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#7c66b5")}
            onMouseLeave={e => (e.currentTarget.style.background = "#9b82d4")}
          >
            Aceptar
          </button>
          <a
            href={urlAviso}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl text-[13px] font-semibold transition-all"
            style={{ background: "transparent", color: "#94a3b8", border: "1px solid #1c2545" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}
          >
            Ver aviso
          </a>
        </div>
      </div>
    </div>
  )
}
