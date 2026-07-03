import type { Metadata } from "next"
import { Suspense } from "react"
import { Campana110View } from "@/components/Campana110View"

export const metadata: Metadata = {
  title: { absolute: "¡Jugemos al 110! — Soporte Dinámico Industrial" },
  description: "Logremos cumplir al 110% la promesa al cliente. Campaña interna SDI.",
  openGraph: {
    title: "¡Jugemos al 110! — Soporte Dinámico Industrial",
    description: "Logremos cumplir al 110% la promesa al cliente.",
    siteName: "Soporte Dinámico Industrial",
  },
}

export default function Campana110Page() {
  return (
    <Suspense>
      <Campana110View />
    </Suspense>
  )
}
