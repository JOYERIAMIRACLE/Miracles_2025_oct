import type { Metadata } from "next"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { separarValores } from "@/lib/identidad"
import { buttonVariants } from "@/components/ui/button"
import Container from "../1tiendacomponentes/container"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://medalladeoro.com.mx"
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""
const DESCRIPCION =
  "Medalla de Oro: joyería en oro 10k y plata 925 para reconocer cada logro, cada amistad y cada amor. Envíos a todo México."

type IdentidadPublica = { slogan: string | null; proposito: string | null; valores: string | null }

// Se lee al construir el sitio: lo que se edita en ¿Quiénes somos? del Portal
// llega aquí en la siguiente reconstrucción de la Tienda.
async function fetchIdentidad(): Promise<IdentidadPublica | null> {
  try {
    const res = await fetch(`${BACKEND}/api/identidad-empresas?pagination[pageSize]=1`, {
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const json = await res.json()
    return (json.data?.[0] as IdentidadPublica) ?? null
  } catch {
    return null
  }
}

export const metadata: Metadata = {
  title: "Nosotros | Medalla de Oro",
  description: DESCRIPCION,
  alternates: { canonical: `${SITE_URL}/nosotros` },
  openGraph: {
    title: "Nosotros | Medalla de Oro",
    description: DESCRIPCION,
    url: `${SITE_URL}/nosotros`,
    siteName: "Medalla de Oro",
    type: "website",
  },
}

export default async function NosotrosPage() {
  const identidad = await fetchIdentidad()
  const slogan = identidad?.slogan?.trim()
  const proposito = identidad?.proposito?.trim()
  const valores = separarValores(identidad?.valores)

  return (
    <Container as="article" size="narrow" className="py-12">

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-violet-600">Inicio</Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-300">Nosotros</span>
      </nav>

      {/* Hero / intro */}
      <header className="mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
          Sobre nosotros
        </p>
        <h1 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight text-balance">
          Cada logro, cada amistad y cada amor merecen su medalla
        </h1>
        <p className="mt-5 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          Todos alguna vez hemos recibido una medalla: por un logro o una meta cumplida, como
          reconocimiento a una amistad increíble o como regalo de un amor inmenso. Medalla de Oro
          existe para esos momentos únicos, con joyería que reconoce lo que vale la pena y acerca a
          quien la regala y a quien la recibe.
        </p>
        <p className="mt-4 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
          Trabajamos con oro 10k y plata 925 y enviamos a todo México: materiales reales, piezas
          bien hechas y que lleguen tal como las elegiste.
        </p>
      </header>

      {/* Propósito — sale del Portal (¿Quiénes somos?) */}
      {(slogan || proposito) && (
        <section
          aria-labelledby="nosotros-proposito"
          className="mb-12 rounded-2xl bg-[#2a1b3d] px-6 py-10 sm:px-10 sm:py-12 dark:ring-1 dark:ring-white/10"
        >
          <h2 id="nosotros-proposito" className="text-xl font-bold text-white">
            Nuestro propósito
          </h2>
          {proposito && (
            <p className="mt-3 text-lg leading-relaxed text-white/85 text-pretty">{proposito}</p>
          )}
          {slogan && (
            <p className="mt-8 text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-violet-300 text-balance">
              {slogan}
            </p>
          )}
        </section>
      )}

      {/* Valores — salen del Portal (¿Quiénes somos?) */}
      {valores.length > 0 && (
        <section aria-labelledby="nosotros-valores" className="mb-12">
          <h2 id="nosotros-valores" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Nuestros valores
          </h2>
          <ul className="flex flex-wrap gap-2.5">
            {valores.map(v => (
              <li
                key={v}
                className="rounded-full border border-violet-200 dark:border-violet-800/60 px-4 py-2 text-base font-semibold text-violet-800 dark:text-violet-200"
              >
                {v}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Materiales y cuidado */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Materiales en los que confiamos
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-violet-800 text-white mb-3">
              Oro 10k
            </span>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Elegimos oro 10k porque ofrece un balance real entre durabilidad y precio accesible —
              una aleación pensada para piezas que se usan a diario, no solo para ocasiones
              especiales, sin perder el brillo y el color que se espera de una joya de oro.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-violet-800 text-white mb-3">
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
          Preferimos ser honestos a prometer de más: respondemos directamente cuando nos escribes,
          empacamos cada pedido a mano y nos tomamos en serio cualquier duda o problema con tu
          compra.
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          Si buscas una pieza en particular, un tamaño específico o simplemente quieres asesoría
          antes de comprar, puedes escribirnos — los datos de contacto están al pie de cada página
          del sitio.
        </p>
      </section>

      {/* CTA */}
      <div className="rounded-2xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-900/40 p-8 text-center">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
          Explora nuestra colección
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5 max-w-md mx-auto">
          Anillos, cadenas, aretes, dijes y más — en oro 10k y plata 925, listos para enviarse a
          cualquier parte de México.
        </p>
        <Link href="/" className={cn(buttonVariants(), "bg-violet-600 hover:bg-violet-700 text-white font-semibold")}>
          Ver la tienda
        </Link>
      </div>

    </Container>
  )
}
