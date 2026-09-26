"use client"

import { Compass, LayoutGrid, UserCircle2, ShieldCheck } from "lucide-react"
import { SeccionVitrina, SeccionHeroContenido } from "./shared"

// Documentación técnica de la Tienda pública (medalladeoro.com.mx), escrita a
// mano — mismo criterio que los paneles de Segundo Cerebro (Arquitectura,
// Aparador): es referencia para el equipo, no contenido editable del negocio,
// así que no vive en Strapi. Se actualiza aquí cuando cambie la estructura
// real del sitio (nuevas rutas, cambios de función). Última actualización:
// 26-sep-2026, junto con el plan de SEO de anillos-de-compromiso/churumbela.

type Pagina = { ruta: string; nota?: string }
type Grupo = { titulo: string; icono: typeof Compass; resumen: string; paginas: Pagina[] }

const GRUPOS: Grupo[] = [
  {
    titulo: "Landing — convencer a quien no te conoce",
    icono: Compass,
    resumen: "De aquí sale el tráfico nuevo y la confianza. El blog y la portada mandan autoridad hacia el catálogo, nunca al revés.",
    paginas: [
      { ruta: "/", nota: "Portada — antes tenía un hero separado, ahora ES la tienda" },
      { ruta: "/nosotros" }, { ruta: "/contacto" }, { ruta: "/distribuidor", nota: "Mayoreo/B2B" },
      { ruta: "/blog", nota: "Motor de contenido — hub del blog" },
      { ruta: "/blog/[slug]", nota: "5 posts reales ya publicados" },
      { ruta: "/producto/[slug]", nota: "Doble función: Landing si llega frío de Google, App si viene navegando el catálogo" },
      { ruta: "/terminos, /privacidad, /envios, /devoluciones", nota: "Confianza/legal — bajo esfuerzo de autoridad" },
    ],
  },
  {
    titulo: "App — convertir a quien ya quiere comprar",
    icono: LayoutGrid,
    resumen: "Catálogo, filtros y cards de producto. No compiten por las mismas palabras que el blog — su trabajo es convertir, no atraer.",
    paginas: [
      { ruta: "/category, /category/[slug]", nota: "9 categorías + anillos-de-compromiso + churumbela" },
      { ruta: "/material/oro-10k, /material/plata-925", nota: "Hub por material" },
      { ruta: "/regalos/[ocasion]", nota: "5 hubs — dan URL real a las tarjetas del home" },
      { ruta: "/carrito, /productos-favoritos", nota: "Ya bloqueadas en robots.txt — correcto, sin cambios" },
    ],
  },
  {
    titulo: "Cuenta — sesión del cliente",
    icono: UserCircle2,
    resumen: "Cero valor de búsqueda. Nunca debe indexarse — son páginas privadas o de entrada de sesión, no contenido para atraer visitas.",
    paginas: [
      { ruta: "/cuenta/login, /registro, /olvide-password" },
      { ruta: "/cuenta, /pedidos, /cotizaciones, /favoritos, /direcciones, /pagos, /perfil", nota: "Requieren sesión de cliente" },
    ],
  },
]

const REGLAS = [
  "Landing manda la autoridad hacia abajo — el blog y \"Nosotros\" enlazan hacia categoría/material con texto descriptivo, nunca \"ver más\".",
  "App hereda autoridad, no la genera — breadcrumb consistente y canonical limpio por página (los filtros son del navegador, no generan URLs duplicadas).",
  "Cuenta nunca se indexa — noindex + robots.txt en las 9 rutas (corregido 26-sep-2026, antes eran 100% indexables sin ningún valor de búsqueda).",
]

function TablaGrupo({ grupo }: { grupo: Grupo }) {
  const Icono = grupo.icono
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
        <div className="h-9 w-9 rounded-lg bg-violet-400/10 border border-violet-400/30 flex items-center justify-center shrink-0">
          <Icono size={18} className="text-violet-500" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{grupo.titulo}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{grupo.resumen}</p>
        </div>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {grupo.paginas.map((p) => (
          <div key={p.ruta} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 px-4 py-2.5">
            <code className="text-[12px] font-mono text-slate-700 dark:text-slate-300 shrink-0 sm:w-[340px]">{p.ruta}</code>
            {p.nota && <p className="text-xs text-slate-400">{p.nota}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SeccionArquitecturaSitio() {
  return (
    <SeccionVitrina>
      <SeccionHeroContenido
        breadcrumb={["Operación", "Arquitectura del sitio"]}
        titulo="Arquitectura del sitio"
        descripcion="Cada página pública de medalladeoro.com.mx clasificada por función — de dónde sale el tráfico nuevo, dónde se convierte, y qué nunca debe salir en Google. Referencia técnica del equipo, se actualiza cuando cambia la estructura real del sitio."
      />

      <div className="grid gap-4">
        {GRUPOS.map((g) => <TablaGrupo key={g.titulo} grupo={g} />)}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={16} className="text-violet-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Reglas de autoridad por nivel</h3>
        </div>
        <ul className="space-y-2">
          {REGLAS.map((r, i) => (
            <li key={i} className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed flex gap-2">
              <span className="text-violet-500 shrink-0">›</span>{r}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] text-slate-400">
        Basado en la investigación real de búsqueda (Google Suggest + Google Ads Keyword Planner, México, 26-sep-2026):
        "anillos de compromiso" — 165,000 búsquedas/mes — es el término de mayor volumen de todo el catálogo, seguido de
        "argollas de matrimonio" (22,200) y "churumbela de oro" (6,600). Ver los posts del blog y las páginas de
        categoría/material/regalos para el detalle completo por término.
      </p>
    </SeccionVitrina>
  )
}
