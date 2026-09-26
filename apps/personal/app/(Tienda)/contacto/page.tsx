import type { Metadata } from "next"
import ContactoClient from "./ContactoClient"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://medalladeoro.com.mx"
const TITLE = "Contacto | Medalla de Oro"
const DESCRIPTION = "Escríbenos por WhatsApp o correo para cotizar una pieza, resolver dudas o pedir algo personalizado. Respuesta en menos de 24 horas."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/contacto` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/contacto`,
    siteName: "Medalla de Oro",
    type: "website",
  },
}

export default function ContactoPage() {
  return <ContactoClient />
}
