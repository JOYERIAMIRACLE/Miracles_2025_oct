"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

// ─── EDITABLE: actualiza estos dos números cada semana ───────────────────────
const META_ANUAL    = 110_000   // miles de pesos
const AVANCE_ACTUAL =  82_687   // miles de pesos — CAMBIA ESTE NÚMERO
// ─────────────────────────────────────────────────────────────────────────────

function formatMiles(n: number) {
  return `$${n.toLocaleString("es-MX")} mil`
}

export function Campana110View() {
  const pct = Math.min((AVANCE_ACTUAL / META_ANUAL) * 100, 100)
  const [animatedPct, setAnimatedPct] = useState(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      const raf = requestAnimationFrame(function step() {
        setAnimatedPct(prev => {
          if (prev >= pct) return pct
          requestAnimationFrame(step)
          return Math.min(prev + 0.8, pct)
        })
      })
      return () => cancelAnimationFrame(raf)
    }, 400)
    return () => clearTimeout(timeout)
  }, [pct])

  return (
    <div className="relative min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center overflow-hidden px-8 py-12">

      {/* ── Triángulo naranja decorativo (esquina inferior derecha) ── */}
      <div
        className="absolute bottom-0 right-0 pointer-events-none"
        style={{
          width: 0, height: 0,
          borderStyle: "solid",
          borderWidth: "0 0 260px 220px",
          borderColor: "transparent transparent #ED8000 transparent",
        }}
      />

      {/* ── Triángulo naranja secundario más pequeño ── */}
      <div
        className="absolute bottom-0 right-0 pointer-events-none opacity-40"
        style={{
          width: 0, height: 0,
          borderStyle: "solid",
          borderWidth: "0 0 180px 140px",
          borderColor: "transparent transparent #ED8000 transparent",
          transform: "translate(-60px, 0)",
        }}
      />

      {/* ── Contenido principal ── */}
      <div className="relative z-10 w-full max-w-5xl">

        {/* Hero: logo + headline */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-12">

          {/* Logo 3S */}
          <div className="shrink-0 w-48 h-48 sm:w-56 sm:h-56">
            <Image
              src="/logo-3s.png"
              alt="SDI — Servir, Solucionar, Simplificar"
              width={224}
              height={224}
              className="w-full h-full object-contain"
              priority
            />
          </div>

          {/* Texto headline */}
          <div className="flex flex-col gap-3 text-center sm:text-left">
            <h1 className="text-6xl sm:text-7xl font-black text-white leading-none tracking-tight">
              ¡Jugemos al 110!
            </h1>
            <p className="text-2xl sm:text-3xl font-semibold text-white leading-snug">
              Logremos cumplir al 110%{" "}
              <br className="hidden sm:block" />
              la{" "}
              <span className="italic text-[#ED8000]">promesa al cliente</span>
            </p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mb-6">
          <div className="relative h-10 bg-white/15 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${animatedPct}%`,
                background: "linear-gradient(90deg, #c46800 0%, #ED8000 60%, #ffaa44 100%)",
              }}
            />
            {/* Porcentaje dentro de la barra */}
            <div className="absolute inset-0 flex items-center justify-end pr-4">
              <span className="text-white font-black text-lg tracking-wide">
                {animatedPct.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Cifras */}
          <div className="flex justify-between items-baseline mt-3 px-1">
            <p className="text-white/60 text-base font-medium">
              {formatMiles(AVANCE_ACTUAL)}
            </p>
            <p className="text-white/40 text-sm">
              meta {formatMiles(META_ANUAL)}
            </p>
          </div>
        </div>

        {/* Separador */}
        <div className="w-full h-px bg-white/10 mb-8" />

        {/* Etiquetas filosofía */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-8">
          <span className="text-white/50 text-lg italic font-medium">Filosofía de equipo</span>
          <span className="hidden sm:block text-white/20 text-xl">·</span>
          <span className="text-white/50 text-lg italic font-medium">Objetivo claro</span>
        </div>
      </div>
    </div>
  )
}
