"use client"

import { useEffect, useRef } from "react"
import createGlobe from "cobe"
import { useTheme } from "next-themes"

export function PortalGlobe() {
  const wrapRef   = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return

    const dark = theme === "dark"
    const size = wrap.offsetWidth || 420

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: size,
      height: size,
      phi: 0,
      theta: 0.3,
      dark: 1,
      diffuse: 1.3,
      mapSamples: 16000,
      mapBrightness: dark ? 6 : 5,
      baseColor: dark ? [0.55, 0.46, 0.85] : [0.5, 0.42, 0.8],
      markerColor: [0.55, 0.36, 0.96],
      glowColor: dark ? [0.32, 0.25, 0.55] : [0.65, 0.58, 0.88],
      markers: [],
    })

    // cobe 2.x has no built-in render loop (README's onRender is stale) — drive it ourselves.
    let phi = 0
    let raf = 0
    const frame = () => {
      phi += 0.0035
      globe.update({ phi })
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    const onResize = () => {
      if (!wrap) return
      const s = wrap.offsetWidth || 420
      globe.update({ width: s, height: s })
    }
    window.addEventListener("resize", onResize)

    return () => {
      cancelAnimationFrame(raf)
      globe.destroy()
      window.removeEventListener("resize", onResize)
    }
  }, [theme])

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div ref={wrapRef} className="relative" style={{ width: "min(100%, 560px)", aspectRatio: "1 / 1" }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  )
}
