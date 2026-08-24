"use client"

import { useEffect, useRef } from "react"
import createGlobe, { type COBEOptions } from "cobe"
import { useTheme } from "next-themes"

type CobeOptionsWithRender = COBEOptions & { onRender: (state: Record<string, number>) => void }

export function PortalGlobe() {
  const wrapRef   = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const phiRef    = useRef(0)
  const { theme } = useTheme()

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return

    const dark = theme === "dark"
    let size = wrap.offsetWidth

    const opts: CobeOptionsWithRender = {
      devicePixelRatio: 2,
      width: size * 2,
      height: size * 2,
      phi: 0,
      theta: 0.3,
      dark: 1,
      diffuse: 1.3,
      mapSamples: 16000,
      mapBrightness: dark ? 4.2 : 3,
      baseColor: dark ? [0.5, 0.42, 0.78] : [0.5, 0.42, 0.8],
      markerColor: [0.55, 0.36, 0.96],
      glowColor: dark ? [0.3, 0.24, 0.5] : [0.62, 0.56, 0.85],
      markers: [],
      onRender: (state) => {
        state.phi = phiRef.current
        phiRef.current += 0.0032
        state.width  = size * 2
        state.height = size * 2
      },
    }
    const globe = createGlobe(canvas, opts)

    const onResize = () => {
      if (wrap) size = wrap.offsetWidth
    }
    window.addEventListener("resize", onResize)

    return () => {
      globe.destroy()
      window.removeEventListener("resize", onResize)
    }
  }, [theme])

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div ref={wrapRef} className="relative" style={{ width: "min(100%, 420px)", aspectRatio: "1 / 1" }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  )
}
