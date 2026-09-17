"use client"

import { TrendingUp } from "lucide-react"
import { PortalGlobe } from "./PortalGlobe"
import { useCurrentUser } from "@/lib/useCurrentUser"
import { useVisitasRango } from "@/api/visitas/visitas"

// Mismo estilo para ambas tarjetas flotantes: bordes muy sutiles en general,
// esquina superior-derecha marcada (más pronunciada) como acento.
const FLOATING_CARD = "rounded-sm rounded-tr-3xl border border-[#BD9206]/30 bg-[#0d0b1a]/85 backdrop-blur-sm"

/**
 * Hero de Inicio — se renderiza AFUERA del container boxed de page.tsx
 * (a todo el ancho de <main>, hasta el sidebar) para que el mural llegue
 * a las orillas reales de la pantalla. El resto de Inicio (comunicados,
 * dashboard, etc.) sigue dentro del boxed container, ver SeccionPortalHome.
 */
export function PortalHomeHero() {
  const { user } = useCurrentUser()
  const displayName = user?.username ?? user?.email?.split("@")[0] ?? ""
  const fechaHoy = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
  const hoy = new Date().toISOString().slice(0, 10)
  const { total: visitasHoy } = useVisitasRango(hoy, hoy)

  return (
    <div className="relative overflow-hidden pt-6 pb-10 sm:pb-16" style={{ background: "#0d0b1a" }}>
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 140% 100% at 50% 35%, #bd920622 0%, transparent 70%)" }} />

      {/* Globo — caja propia (grande, no todo el mural), SIEMPRE visible (ya no
          se oculta en mobile). El globo mismo es responsivo (clamp 220px-480px,
          ver PortalGlobe) — encoge en vez de recortarse. La caja que lo
          contiene también escala (h-80 mobile → h-150 desde sm) para que
          siempre sobre espacio libre ABAJO del globo, donde vive el label del
          dominio, antes de la zona donde la vitrina se monta encima (ver
          SeccionPortalHome -mt). Se centra en TODO el mural (no en el boxed)
          — el mural sigue siendo full-bleed, solo las tarjetas de abajo se
          alinean al boxed. */}
      <div className="relative w-full max-w-160 mx-auto h-80 sm:h-150">
        <PortalGlobe heroMode />
      </div>

      {/* Tarjetas flotantes — alineadas al MISMO ancho que la vitrina de abajo
          (max-w-6xl, no max-w-7xl — ese es el marco general de page.tsx, pero
          la vitrina en sí es más angosta, ver SeccionPortalHome). Sin esto, la
          tarjeta de la derecha se pasa del borde real de la vitrina.
          OJO: este wrapper NO lleva px-6 — en elementos position:absolute, el
          padding del contenedor NO afecta a left/right/top/bottom (el
          "containing block" para un hijo absoluto es la PADDING BOX del
          padre, así que left-0 cae en el borde exterior del padding, no
          después de él). Por eso el inset de 24px (igual al px-6 de page.tsx)
          se pone directo en cada tarjeta como left-6/right-6, no aquí. */}
      <div className="absolute inset-0 max-w-6xl mx-auto">
        {/* "Bienvenido" — esquina superior izquierda. left-6 (no left-0): ver
            nota arriba sobre por qué el padding del wrapper no sirve para
            hijos absolutos — 24px replica el px-6 real de page.tsx. top-6
            (no top-0): el hero empieza justo debajo del header sticky,
            necesita aire para no pegarse a él. max-w-[85%] en mobile evita
            que se recorte en pantallas muy angostas (320-375px). */}
        <div className={`absolute top-4 sm:top-6 left-6 z-10 max-w-[85%] sm:max-w-sm px-4 py-3 sm:px-5 sm:py-4 ${FLOATING_CARD}`}>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-white leading-tight">Bienvenido, {displayName}</h1>
          <p className="text-sm text-slate-300 mt-1">{fechaHoy}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Tipo de cambio: <span className="font-semibold text-[#F8C930]">$17.15</span> MXN
          </p>
        </div>

        {/* "Tráfico web" — esquina inferior derecha, mismo estilo que "Bienvenido".
            bottom-4 en mobile (<640px): el mural mobile es más compacto
            (h-80 en la caja del globo) y esta tarjeta cae en el colchón pb-10
            debajo de esa caja, lejos del globo — solo necesita separarse del
            borde. bottom-28 desde sm: ahí el mural es alto (por el globo,
            responsivo pero la caja que lo contiene sigue midiendo 600px) y
            esta tarjeta vive en el wrapper que cubre TODO el hero, así que su
            "bottom" se mide contra el borde inferior real — necesita subir
            más para no chocar con la vitrina, que se monta encima del hero. */}
        {visitasHoy != null && (
          <div className={`absolute bottom-4 sm:bottom-28 right-6 z-10 max-w-55 px-4 py-3 flex items-start gap-2.5 ${FLOATING_CARD}`}>
            <TrendingUp size={16} className="text-yellow-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-white">Tráfico web</p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                <span className="text-yellow-500 font-semibold">{visitasHoy}</span> visitas hoy
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
