"use client"

import { useEffect, useRef, useState } from "react"
import createGlobe from "cobe"
import { useTheme } from "next-themes"
import { MapPin } from "lucide-react"
import { useGetIdentidad } from "@/api/identidad-empresa/getIdentidad"

const MEXICO_LOCATION: [number, number] = [19.4326, -99.1332]
const MEXICO_PHI   = 0.15
const MEXICO_THETA = 0.35
const BASE_THETA   = 0.3

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

export function PortalGlobe({ heroMode = false }: { heroMode?: boolean }) {
  const wrapRef   = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hoverRef  = useRef(false)
  const { theme } = useTheme()
  const [hover, setHover] = useState(false)
  const { identidad } = useGetIdentidad()

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return

    const dark = theme === "dark"
    const measure = () => Math.max(80, Math.min(wrap.offsetWidth, wrap.offsetHeight, 640))
    let size = measure()
    canvas.style.width  = `${size}px`
    canvas.style.height = `${size}px`

    const baseBrightness = dark ? 6 : 5

    const globe = createGlobe(canvas, {
      // Antes fijo en 2 (retina) — con el globo ahora fijo en 480px, eso era un
      // canvas de hasta 960×960px real, redibujado cada frame, para siempre.
      // Se limita a 1 (respeta pantallas de baja densidad, nunca sube de ahí)
      // para minimizar el costo por frame — sigue viéndose nítido a este tamaño.
      devicePixelRatio: Math.min(window.devicePixelRatio || 1, 1),
      width: size,
      height: size,
      phi: 0,
      theta: BASE_THETA,
      dark: 1,
      diffuse: 1.4,
      mapSamples: 8000,
      mapBrightness: baseBrightness,
      // Colores dorados — brand Medalla de Oro
      baseColor: dark ? [0.42, 0.34, 0.08] : [0.38, 0.30, 0.06],
      markerColor: [1.0, 0.82, 0.12],
      glowColor: dark ? [0.50, 0.38, 0.04] : [0.62, 0.50, 0.08],
      markers: [{ location: MEXICO_LOCATION, size: 0.07 }],
    })

    let autoPhi    = 0
    let phi        = 0
    let thetaCur   = BASE_THETA
    let brightness = baseBrightness
    let raf = 0
    const frame = () => {
      autoPhi += 0.0035
      const targetPhi    = hoverRef.current ? MEXICO_PHI   : autoPhi
      const targetTheta  = hoverRef.current ? MEXICO_THETA : BASE_THETA
      const targetBright = hoverRef.current ? baseBrightness + 3 : baseBrightness
      phi        = lerp(phi, targetPhi, 0.06)
      thetaCur   = lerp(thetaCur, targetTheta, 0.06)
      brightness = lerp(brightness, targetBright, 0.08)
      globe.update({ phi, theta: thetaCur, mapBrightness: brightness })
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    const onResize = () => {
      size = measure()
      canvas.style.width  = `${size}px`
      canvas.style.height = `${size}px`
      globe.update({ width: size, height: size })
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(wrap)

    return () => {
      cancelAnimationFrame(raf)
      globe.destroy()
      ro.disconnect()
    }
  }, [theme])

  return (
    <a
      href="https://medalladeoro.com.mx"
      target="_blank"
      rel="noopener noreferrer"
      className={`absolute inset-0 flex ${heroMode ? "items-start" : "items-center"} justify-center group cursor-pointer`}
      onMouseEnter={() => { hoverRef.current = true; setHover(true) }}
      onMouseLeave={() => { hoverRef.current = false; setHover(false) }}
    >
      <div
        ref={wrapRef}
        className="relative transition-[filter] duration-500"
        style={heroMode ? {
          // heroMode: ancho Y alto con la MISMA expresión clamp() — nunca una
          // caja rectangular que dependa de centrar algo adentro (esa mezcla,
          // aspectRatio+maxHeight con valores distintos, fue justo el bug que
          // desalineaba el globo antes). 40vw encoge en pantallas angostas
          // (tablet) sin recortarse contra el sidebar, tope en 480px en
          // desktop. measure() (abajo) calcula min(offsetWidth, offsetHeight,
          // 640) para el canvas — al ser esta caja siempre cuadrada, no hay
          // ningún sobrante que desalinee nada.
          width: "clamp(220px, 40vw, 480px)",
          height: "clamp(220px, 40vw, 480px)",
          filter: hover
            ? "drop-shadow(0 0 55px rgba(189,146,6,0.45))"
            : "drop-shadow(0 0 0 rgba(189,146,6,0))",
        } : {
          width: "min(100%, 560px)",
          aspectRatio: "1 / 1",
          maxHeight: "calc(100% - 76px)",
          filter: hover
            ? "drop-shadow(0 0 55px rgba(189,146,6,0.45))"
            : "drop-shadow(0 0 0 rgba(189,146,6,0))",
        }}
      >
        <canvas ref={canvasRef} />
      </div>

      {/* Tooltip dirección — solo en modo normal */}
      {!heroMode && (
        <div className={`absolute bottom-16 inset-x-4 sm:inset-x-10 rounded-xl border border-yellow-600/30 bg-[#1a1300]/90 backdrop-blur-sm px-4 py-3 flex items-start gap-2.5 transition-all duration-300 ${
          hover ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}>
          <MapPin size={16} className="text-yellow-500 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-white">Medalladeoro</p>
            <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-line line-clamp-3">
              {identidad?.direccion || "Dirección pendiente de definir"}
            </p>
          </div>
        </div>
      )}

      {/* Dominio — siempre visible. bottom-16 (no bottom-4): deja espacio libre
          abajo, fuera de la zona donde la vitrina se monta encima del mural. */}
      <span className="absolute bottom-16 inset-x-0 text-center text-sm font-semibold text-yellow-600 group-hover:text-yellow-400 transition-colors">
        medalladeoro.com.mx
      </span>
    </a>
  )
}
