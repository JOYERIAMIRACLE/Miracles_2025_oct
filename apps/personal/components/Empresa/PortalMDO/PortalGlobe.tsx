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

export function PortalGlobe() {
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
      devicePixelRatio: 2,
      width: size,
      height: size,
      phi: 0,
      theta: BASE_THETA,
      dark: 1,
      diffuse: 1.3,
      mapSamples: 16000,
      mapBrightness: baseBrightness,
      baseColor: dark ? [0.55, 0.46, 0.85] : [0.5, 0.42, 0.8],
      markerColor: [0.9, 0.85, 1],
      glowColor: dark ? [0.32, 0.25, 0.55] : [0.65, 0.58, 0.88],
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
      href="https://medallitadeoro.com.mx"
      target="_blank"
      rel="noopener noreferrer"
      className="absolute inset-0 flex items-center justify-center group cursor-pointer"
      onMouseEnter={() => { hoverRef.current = true; setHover(true) }}
      onMouseLeave={() => { hoverRef.current = false; setHover(false) }}
    >
      <div
        ref={wrapRef}
        className="relative transition-[filter] duration-500"
        style={{
          width: "min(100%, 560px)",
          aspectRatio: "1 / 1",
          maxHeight: "calc(100% - 76px)",
          filter: hover ? "drop-shadow(0 0 45px rgba(167,139,250,0.55))" : "drop-shadow(0 0 0 rgba(167,139,250,0))",
        }}
      >
        <canvas ref={canvasRef} />
      </div>

      <div className={`absolute bottom-16 inset-x-4 sm:inset-x-10 rounded-xl border border-violet-500/30 bg-slate-950/90 backdrop-blur-sm px-4 py-3 flex items-start gap-2.5 transition-all duration-300 ${
        hover ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
      }`}>
        <MapPin size={16} className="text-violet-400 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-xs font-bold text-white">Medallitadeoro</p>
          <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-line line-clamp-3">
            {identidad?.direccion || "Dirección pendiente de definir"}
          </p>
        </div>
      </div>

      <span className="absolute bottom-4 inset-x-0 text-center text-sm font-semibold text-violet-400 group-hover:text-violet-300 transition-colors">
        medallitadeoro.com.mx
      </span>
    </a>
  )
}
