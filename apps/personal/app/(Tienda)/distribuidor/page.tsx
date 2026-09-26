import type { Metadata } from "next"
import DistribuidorClient from "./DistribuidorClient"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://medalladeoro.com.mx"
const TITLE = "Distribuidor de Joyería al Mayoreo | Medalla de Oro"
const DESCRIPTION = "Compra joyería en oro 10k y plata 925 al por mayor para tu negocio: precios de mayoreo, catálogo completo y envíos a todo México."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/distribuidor` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/distribuidor`,
    siteName: "Medalla de Oro",
    type: "website",
  },
}

export default function DistribuidorPage() {
  return <DistribuidorClient />
}
