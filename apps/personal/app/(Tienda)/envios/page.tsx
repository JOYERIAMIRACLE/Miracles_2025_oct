import type { Metadata } from "next"
import Link from "next/link"

const SITE_URL = "https://miracles-frontend.pages.dev"

// Mismo correo de marcador de posición usado en el footer.
const CONTACTO_EMAIL = "contacto@medalladeoro.com.mx"

export const metadata: Metadata = {
  title: "Envíos | Joyería Miracles",
  description:
    "Tiempos de despacho y entrega, costo de envío y seguimiento de pedidos de Joyería Miracles — envíos a todo México.",
  alternates: { canonical: `${SITE_URL}/envios` },
}

export default function EnviosPage() {
  return (
    <article className="max-w-3xl mx-auto px-6 sm:px-8 py-12">

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-amber-600">Inicio</Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-300">Envíos</span>
      </nav>

      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
          Envíos
        </p>
        <h1 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight">
          Envíos a todo México
        </h1>
        <p className="mt-4 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
          Empacamos cada pedido a mano y lo despachamos lo antes posible. Aquí encuentras los
          tiempos y detalles de envío para que sepas exactamente qué esperar después de comprar.
        </p>
      </header>

      <div className="space-y-10">

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Tiempo de preparación y despacho
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Preparamos y despachamos tu pedido dentro de un plazo de <strong className="text-gray-900 dark:text-gray-100">24 a 48 horas hábiles</strong> después
            de confirmada tu compra. En temporadas de alta demanda (fin de año, fechas
            conmemorativas) este plazo puede extenderse ligeramente; si eso llega a pasar, te lo
            haremos saber.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Tiempo de entrega
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Una vez despachado, tu pedido llega en un estimado de <strong className="text-gray-900 dark:text-gray-100">5 a 7 días hábiles</strong> a
            cualquier destino dentro de México. Este tiempo puede variar según tu ubicación —
            zonas urbanas suelen recibir el pedido más rápido que zonas rurales o de difícil
            acceso — y según la carga operativa de la paquetería en cada temporada.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Costo de envío
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            El costo de envío se calcula automáticamente al finalizar tu compra, según tu código
            postal y el peso del pedido. Si tienes dudas sobre el costo antes de comprar, puedes
            escribirnos y con gusto te damos una cotización.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Paqueterías
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Trabajamos con paqueterías de cobertura nacional para garantizar que tu pedido llegue
            a cualquier parte de México. La paquetería asignada a tu envío puede variar según tu
            zona, y siempre queda registrada en la confirmación de tu pedido.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Seguimiento de tu pedido
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            En cuanto tu pedido sale de nuestras manos, te enviamos el número de guía y el enlace
            para rastrearlo directamente con la paquetería, para que puedas ver en tiempo real
            dónde va tu paquete hasta que llegue a tu puerta.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Retrasos o entregas fallidas
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
            Si tu pedido se retrasa más allá del tiempo estimado, o si la paquetería reporta un
            intento de entrega fallido (dirección incompleta, nadie recibió el paquete, etc.),
            contáctanos con tu número de pedido y le daremos seguimiento directamente con la
            paquetería para resolverlo lo antes posible.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Escríbenos a{" "}
            <a href={`mailto:${CONTACTO_EMAIL}`} className="text-amber-600 hover:text-amber-700 dark:text-amber-400 font-medium">
              {CONTACTO_EMAIL}
            </a>{" "}
            y con gusto te apoyamos.
          </p>
        </section>

      </div>

    </article>
  )
}
