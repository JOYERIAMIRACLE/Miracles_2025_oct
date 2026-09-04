import type { Metadata } from "next"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const SITE_URL = "https://miracles-frontend.pages.dev"

export const metadata: Metadata = {
  title: "Nosotros | Joyería Miracles",
  description:
    "Conoce Joyería Miracles: un negocio familiar dedicado a la joyería fina en oro 10k y plata 925, hecha con cuidado y enviada a todo México.",
  alternates: { canonical: `${SITE_URL}/nosotros` },
  openGraph: {
    title: "Nosotros | Joyería Miracles",
    description:
      "Conoce Joyería Miracles: un negocio familiar dedicado a la joyería fina en oro 10k y plata 925, hecha con cuidado y enviada a todo México.",
    url: `${SITE_URL}/nosotros`,
    siteName: "Joyería Miracles",
    type: "website",
  },
}

export default function NosotrosPage() {
  return (
    <article className="max-w-4xl mx-auto px-6 sm:px-8 py-12">

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-amber-600">Inicio</Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-300">Nosotros</span>
      </nav>

      {/* Hero / intro */}
      <header className="mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
          Sobre nosotros
        </p>
        <h1 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight">
          Joyería que se hace con cuidado, pieza por pieza
        </h1>
        <p className="mt-5 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          Somos Joyería Miracles — un negocio familiar dedicado a la joyería fina, con la marca
          registrada como Medalla de oro. No somos una cadena grande ni una fábrica anónima: somos
          un equipo pequeño que revisa cada pieza antes de que salga por la puerta, porque sabemos
          que lo que vendemos no es solo un accesorio, es algo que alguien va a usar todos los días
          o va a regalar en un momento importante.
        </p>
        <p className="mt-4 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
          Trabajamos con oro 10k y plata 925, y enviamos a todo México. Ese es el compromiso simple
          detrás de todo lo que hacemos: materiales reales, buen trabajo, y que la pieza llegue en
          las mismas condiciones en las que la elegiste.
        </p>
      </header>

      {/* Materiales y cuidado */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Materiales en los que confiamos
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-amber-800 text-white mb-3">
              Oro 10k
            </span>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Elegimos oro 10k porque ofrece un balance real entre durabilidad y precio accesible —
              una aleación pensada para piezas que se usan a diario, no solo para ocasiones
              especiales, sin perder el brillo y el color que se espera de una joya de oro.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-amber-800 text-white mb-3">
              Plata 925
            </span>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Nuestra plata es ley 925 (plata esterlina): 92.5% plata pura, la proporción estándar
              en joyería fina para lograr piezas resistentes que mantienen su brillo con el cuidado
              adecuado.
            </p>
          </div>
        </div>
        <p className="mt-6 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          Cada pieza pasa por una revisión antes de empacarse. Al ser hechas con procesos
          artesanales, es normal que existan variaciones mínimas entre piezas de un mismo modelo —
          eso es parte de lo que hace que una joya se sienta real y no salida en serie de una línea
          industrial.
        </p>
      </section>

      {/* Compromiso de servicio */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Nuestro compromiso contigo
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
          Preferimos ser honestos a prometer de más. Somos un negocio pequeño en crecimiento, y
          eso significa que respondemos directamente cuando nos escribes, empacamos cada pedido a
          mano, y nos tomamos en serio cualquier duda o problema que tengas con tu compra.
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          Si buscas una pieza en particular, un tamaño específico o simplemente quieres asesoría
          antes de comprar, puedes escribirnos — los datos de contacto están al pie de cada página
          del sitio.
        </p>
      </section>

      {/* CTA */}
      <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40 p-8 text-center">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
          Explora nuestra colección
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5 max-w-md mx-auto">
          Anillos, cadenas, aretes, dijes y más — en oro 10k y plata 925, listos para enviarse a
          cualquier parte de México.
        </p>
        <Link href="/tienda" className={cn(buttonVariants(), "bg-amber-600 hover:bg-amber-700 text-white font-semibold")}>
          Ver la tienda
        </Link>
      </div>

    </article>
  )
}
