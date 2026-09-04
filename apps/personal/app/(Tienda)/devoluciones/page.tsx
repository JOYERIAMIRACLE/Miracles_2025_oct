import type { Metadata } from "next"
import Link from "next/link"

const SITE_URL = "https://miracles-frontend.pages.dev"

// Mismo correo de marcador de posición usado en el footer.
const CONTACTO_EMAIL = "contacto@medalladeoro.com.mx"

export const metadata: Metadata = {
  title: "Devoluciones y garantía | Joyería Miracles",
  description:
    "Política de devoluciones y garantía de Joyería Miracles: ventana de devolución, piezas no elegibles, cómo solicitar una devolución y garantía por defectos de fabricación.",
  alternates: { canonical: `${SITE_URL}/devoluciones` },
}

export default function DevolucionesPage() {
  return (
    <article className="max-w-3xl mx-auto px-6 sm:px-8 py-12">

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-amber-600">Inicio</Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-300">Devoluciones y garantía</span>
      </nav>

      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
          Devoluciones
        </p>
        <h1 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight">
          Devoluciones y garantía
        </h1>
        <p className="mt-4 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
          Queremos que estés seguro de tu compra. Si una pieza no era lo que esperabas, esto es lo
          que puedes hacer.
        </p>
      </header>

      <div className="space-y-10">

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Ventana de devolución
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Cuentas con <strong className="text-gray-900 dark:text-gray-100">15 días naturales</strong> a
            partir de la fecha en que recibes tu pedido para solicitar una devolución. Pasado ese
            plazo, ya no podemos procesar la devolución de la pieza.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Condiciones para la devolución
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Para aceptar una devolución, la pieza debe estar sin uso, en las mismas condiciones en
            que la recibiste, con su empaque original y, si tu pedido incluyó etiquetas o
            certificado de la pieza, estos también deben regresar completos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Piezas no elegibles para devolución
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
            Por razones de higiene, los <strong className="text-gray-900 dark:text-gray-100">aretes y broqueles</strong> no
            son elegibles para devolución una vez que el empaque ha sido abierto, salvo que
            presenten un defecto de fabricación (ver garantía más abajo).
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Tampoco aceptamos devoluciones de piezas personalizadas o hechas por encargo (por
            ejemplo, dijes con nombre grabado o medidas fuera de catálogo), ya que se fabrican
            específicamente para ti.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Cómo solicitar una devolución
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Escríbenos por correo a{" "}
            <a href={`mailto:${CONTACTO_EMAIL}`} className="text-amber-600 hover:text-amber-700 dark:text-amber-400 font-medium">
              {CONTACTO_EMAIL}
            </a>{" "}
            o por WhatsApp (enlace disponible en el pie de página) indicando tu número de pedido y
            el motivo de la devolución. Te confirmaremos si tu caso cumple las condiciones y te
            daremos las instrucciones para enviarnos la pieza de regreso.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Reembolso
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Una vez que recibimos e inspeccionamos la pieza devuelta, procesamos el reembolso al
            mismo método de pago que usaste en la compra original. El reembolso puede tardar entre{" "}
            <strong className="text-gray-900 dark:text-gray-100">5 y 10 días hábiles</strong> en
            reflejarse, dependiendo de tu banco o plataforma de pago. El costo de envío original
            no es reembolsable, salvo que la devolución sea por un defecto de fabricación o un
            error de nuestra parte.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Garantía por defectos de fabricación
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Además de la ventana de devolución, respaldamos nuestras piezas con{" "}
            <strong className="text-gray-900 dark:text-gray-100">90 días de garantía</strong> contra
            defectos de fabricación en el material o el ensamblaje (por ejemplo, un cierre que
            falla o una soldadura que cede en condiciones normales de uso) a partir de la fecha de
            entrega. Esta garantía no cubre el desgaste normal por uso diario, golpes, mal uso, ni
            piezas que hayan sido modificadas o reparadas por un tercero ajeno a nosotros. Si
            crees que tu pieza tiene un defecto de fabricación, contáctanos con fotos del problema
            y tu número de pedido y lo evaluaremos.
          </p>
        </section>

      </div>

    </article>
  )
}
