import type { Metadata } from "next"
import { SoporteDinamicoLanding } from "@/components/SoporteDinamicoLanding"

export const metadata: Metadata = {
  title: { absolute: "Soporte Dinámico Industrial" },
  description: "Hub de gestión interna · Solucionar, Simplificar, Servir.",
  openGraph: {
    title: "Soporte Dinámico Industrial",
    description: "Hub de gestión interna · Solucionar, Simplificar, Servir.",
    siteName: "Soporte Dinámico Industrial",
  },
}

export default function SoporteDinamicoPage() {
  return <SoporteDinamicoLanding />
}
