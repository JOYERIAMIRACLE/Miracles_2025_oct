import type { Metadata } from "next"
import Link from "next/link"
import Container from "../1tiendacomponentes/container"
import { ExcluirMedicion } from "./excluir-medicion"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://medalladeoro.com.mx"

// Mismo correo de marcador de posición usado en el footer (1tiendacomponentes/footer.tsx) —
// se reutiliza aquí verbatim para no tener dos "contactos oficiales" distintos en el sitio.
const CONTACTO_EMAIL = "contacto@medalladeoro.com.mx"

export const metadata: Metadata = {
  title: "Política de privacidad | Medalla de Oro",
  description:
    "Cómo Medalla de Oro recopila, usa y protege tus datos personales al comprar en el sitio: qué información pedimos, con quién la compartimos y tus derechos.",
  alternates: { canonical: `${SITE_URL}/privacidad` },
}

export default function PrivacidadPage() {
  return (
    <Container as="article" size="narrow" className="py-12">

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-violet-600">Inicio</Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-300">Política de privacidad</span>
      </nav>

      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
          Legal
        </p>
        <h1 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight">
          Política de privacidad
        </h1>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Última actualización: 24 de septiembre de 2026
        </p>
        <p className="mt-4 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
          En Joyería Miracles nos tomamos en serio la privacidad de quienes compran con nosotros.
          Esta política explica de forma clara qué información recopilamos, para qué la usamos y
          qué opciones tienes al respecto.
        </p>
      </header>

      <div className="space-y-10">

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Qué información recopilamos
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
            Cuando realizas un pedido te pedimos únicamente la información necesaria para
            procesarlo y entregártelo: nombre, dirección de envío, correo electrónico y número de
            teléfono.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
            Para enviarnos una solicitud de pedido o cotización puedes crear una cuenta con tu
            nombre, correo electrónico y una contraseña. También puedes escribirnos desde el
            formulario de contacto con tu nombre, teléfono, correo (opcional) y un mensaje. Si lo
            deseas, puedes indicarnos cómo nos conociste.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Tu carrito de compra y tu lista de favoritos se guardan directamente en el navegador
            que estás usando (almacenamiento local del dispositivo), no en un servidor — por eso
            esa información desaparece si limpias los datos del navegador o cambias de
            dispositivo. Al enviar tu solicitud, los artículos de tu carrito llegan a nosotros.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Cómo usamos tu información
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Usamos tus datos para atender tu solicitud: contactarte por WhatsApp o correo,
            confirmar tu pedido, coordinar el envío con la paquetería correspondiente y responder
            cualquier duda de servicio a cliente. Además, usamos la información anónima de
            navegación que se describe en la sección de medición para entender cómo llegan las
            personas al sitio y mejorarlo.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Con quién compartimos tu información
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Compartimos únicamente los datos indispensables para el envío (nombre, dirección y
            teléfono) con la paquetería encargada de entregar tu pedido. No vendemos, rentamos ni
            compartimos tu información personal con terceros para fines de mercadotecnia.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Seguridad de tus datos
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Tomamos medidas razonables para proteger la información que nos proporcionas durante
            el proceso de compra. La información de pago se procesa a través de las plataformas de
            pago disponibles en el sitio; nosotros no almacenamos los datos completos de tu
            tarjeta en nuestros propios sistemas.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Tus derechos sobre tus datos
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Puedes solicitarnos en cualquier momento acceder a los datos personales que tenemos
            sobre ti, corregirlos si están desactualizados o incompletos, o pedir que los
            eliminemos de nuestros registros una vez que tu pedido haya concluido. Para ejercer
            cualquiera de estos derechos, escríbenos al correo de contacto al final de esta
            página.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Cookies y almacenamiento local
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            El sitio utiliza el almacenamiento local de tu navegador (localStorage) para recordar
            el contenido de tu carrito de compra y tu lista de favoritos mientras navegas, sin
            necesidad de iniciar sesión. Esta información vive únicamente en tu dispositivo: no la
            recibimos, almacenamos ni consultamos nosotros. Además guarda los dos identificadores
            aleatorios de la medición anónima descrita abajo. No usamos cookies de terceros.
            Puedes borrar todo esto en cualquier momento desde la configuración de tu navegador.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Medición anónima del sitio
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
            Para saber cuántas personas visitan la tienda y de dónde llegan (por ejemplo, desde
            Instagram, Google o WhatsApp), registramos de forma anónima las páginas que visitas, si
            agregas un producto al carrito, si tocas un botón de contacto y qué buscas en el
            sitio. Para eso guardamos en tu navegador dos identificadores aleatorios (uno de tu
            visita y otro de tu navegador) y el origen de tu visita, como la red social o el sitio
            del que llegaste.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
            No guardamos tu dirección IP en nuestra base de datos, tu nombre ni ningún dato que
            te identifique, y no compartimos esta información con terceros con fines de
            publicidad. Si nos dejas tus datos (formulario de contacto, cuenta o solicitud de
            cotización), asociamos esos identificadores a tu solicitud para saber qué medio te
            trajo hasta nosotros.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Respetamos la señal &quot;No rastrear&quot; y el Control Global de Privacidad de tu
            navegador. También puedes desactivar la medición en este navegador con el siguiente
            botón.
          </p>
          <ExcluirMedicion />
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Contacto
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Si tienes cualquier duda sobre esta política de privacidad o sobre el manejo de tus
            datos personales, puedes escribirnos a{" "}
            <a href={`mailto:${CONTACTO_EMAIL}`} className="text-violet-600 hover:text-violet-700 dark:text-violet-400 font-medium">
              {CONTACTO_EMAIL}
            </a>.
          </p>
        </section>

      </div>

    </Container>
  )
}
