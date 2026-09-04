import type { Metadata } from "next"
import Link from "next/link"

const SITE_URL = "https://miracles-frontend.pages.dev"

export const metadata: Metadata = {
  title: "Términos y condiciones | Joyería Miracles",
  description:
    "Términos y condiciones de compra en Joyería Miracles: precios, disponibilidad, métodos de pago, propiedad intelectual y responsabilidades del sitio.",
  alternates: { canonical: `${SITE_URL}/terminos` },
}

const ULTIMA_ACTUALIZACION = "4 de septiembre de 2026"

export default function TerminosPage() {
  return (
    <article className="max-w-3xl mx-auto px-6 sm:px-8 py-12">

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-amber-600">Inicio</Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-300">Términos y condiciones</span>
      </nav>

      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
          Legal
        </p>
        <h1 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight">
          Términos y condiciones
        </h1>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Última actualización: {ULTIMA_ACTUALIZACION}
        </p>
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-l-4 border-amber-400 pl-4">
          Los tiempos y condiciones específicas de envío y devolución (días de entrega, ventana
          de devolución, garantía) no se repiten aquí — viven en las páginas dedicadas de{" "}
          <Link href="/envios" className="text-amber-600 hover:text-amber-700 dark:text-amber-400 font-medium">
            Envíos
          </Link>{" "}
          y{" "}
          <Link href="/devoluciones" className="text-amber-600 hover:text-amber-700 dark:text-amber-400 font-medium">
            Devoluciones
          </Link>{" "}
          para que siempre estén actualizadas en un solo lugar.
        </p>
      </header>

      <div className="space-y-10">

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            1. Aceptación de los términos
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Al navegar y realizar una compra en este sitio, aceptas los términos y condiciones
            descritos a continuación. Si no estás de acuerdo con alguno de estos puntos, te
            pedimos no utilizar el sitio para realizar pedidos. Nos reservamos el derecho de
            actualizar estos términos en cualquier momento; los cambios aplican a partir de su
            publicación en esta misma página.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            2. Productos y disponibilidad
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
            Hacemos nuestro mejor esfuerzo por mostrar fotografías y descripciones fieles a cada
            pieza. Por tratarse de joyería trabajada de forma artesanal, es normal que existan
            variaciones mínimas de tono, brillo o acabado entre una pieza y otra del mismo modelo;
            estas variaciones son propias del material y no se consideran un defecto.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            La disponibilidad de cada producto puede cambiar sin previo aviso. Si compras una
            pieza que se agota antes de que podamos surtir tu pedido, te contactaremos para
            ofrecerte una alternativa equivalente o el reembolso correspondiente.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            3. Precios
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Todos los precios publicados en el sitio están expresados en pesos mexicanos (MXN) e
            incluyen los impuestos aplicables, salvo que se indique lo contrario. Los precios
            pueden cambiar sin previo aviso debido a la fluctuación del costo de los metales, pero
            el precio que se te cobra es siempre el que aparecía vigente al momento de confirmar
            tu pedido.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            4. Aceptación de pedidos
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Recibir tu pedido no implica automáticamente su aceptación. Nos reservamos el derecho
            de rechazar o cancelar un pedido en casos como error evidente en el precio publicado,
            falta de disponibilidad del producto, o sospecha razonable de fraude — en cualquiera
            de estos casos te notificaremos y, si ya se realizó un cargo, se reembolsará en su
            totalidad.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            5. Métodos de pago
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Aceptamos los métodos de pago que se muestran disponibles al momento de finalizar tu
            compra en el sitio. Toda la información de pago se procesa a través de las
            plataformas correspondientes; nosotros no almacenamos los datos completos de tu
            tarjeta en nuestros propios sistemas.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            6. Responsabilidades del usuario
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Al realizar un pedido te comprometes a proporcionar información de contacto y de
            envío verdadera, completa y actualizada. No nos hacemos responsables por retrasos o
            fallas en la entrega derivadas de datos de envío incorrectos o incompletos
            proporcionados al momento de la compra.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            7. Propiedad intelectual
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            El contenido de este sitio — incluyendo fotografías de producto, textos, logotipos y
            diseño visual — es propiedad de Joyería Miracles / Medalla de oro. No está permitido
            reproducir, distribuir o utilizar este contenido con fines comerciales sin nuestra
            autorización previa por escrito.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            8. Limitación de responsabilidad
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Trabajamos para que la información del sitio sea precisa y para que cada pedido llegue
            en buen estado, pero no garantizamos que el sitio esté libre de errores en todo
            momento. En la medida permitida por la ley, no somos responsables por daños indirectos
            derivados del uso del sitio o de la imposibilidad de acceder a él en un momento dado.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            9. Ley aplicable
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Estos términos se rigen por las leyes vigentes en los Estados Unidos Mexicanos.
            Cualquier controversia derivada del uso de este sitio o de una compra realizada en él
            se someterá a la legislación y autoridades competentes en México, incluyendo, cuando
            aplique, a la Procuraduría Federal del Consumidor (PROFECO).
          </p>
        </section>

      </div>

    </article>
  )
}
