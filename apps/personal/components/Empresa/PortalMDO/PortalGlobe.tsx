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
    let width  = wrap.offsetWidth
    let height = wrap.offsetHeight

    const opts: CobeOptionsWithRender = {
      devicePixelRatio: 2,
      width: width * 2,
      height: height * 2,
      phi: 0,
      theta: 0.32,
      dark: dark ? 1 : 0,
      diffuse: 1.2,
      mapSamples: 14000,
      mapBrightness: dark ? 3.6 : 6.4,
      baseColor: dark ? [0.35, 0.28, 0.58] : [0.62, 0.56, 0.85],
      markerColor: [0.55, 0.36, 0.96],
      glowColor: dark ? [0.24, 0.18, 0.46] : [0.86, 0.83, 0.97],
      markers: [],
      onRender: (state) => {
        state.phi = phiRef.current
        phiRef.current += 0.0032
        state.width  = width * 2
        state.height = height * 2
      },
    }
    const globe = createGlobe(canvas, opts)

    const onResize = () => {
      if (!wrap) return
      width  = wrap.offsetWidth
      height = wrap.offsetHeight
    }
    window.addEventListener("resize", onResize)

    return () => {
      globe.destroy()
      window.removeEventListener("resize", onResize)
    }
  }, [theme])

  return (
    <div ref={wrapRef} className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", maxWidth: 520, maxHeight: 520, aspectRatio: "1 / 1" }}
      />
    </div>
  )
}
