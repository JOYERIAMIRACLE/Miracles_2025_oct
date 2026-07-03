import type { Metadata } from "next"
import { ConcursoView } from "@/components/ConcursoView"

export const metadata: Metadata = {
  title: { absolute: "Somos Diferentes Innovando — Soporte Dinámico Industrial" },
  description: "Concurso interno de lluvia de ideas SDI. Comparte tu propuesta y muestra tu mejor versión.",
  openGraph: {
    title: "Somos Diferentes Innovando — SDI",
    description: "Concurso interno de lluvia de ideas. Comparte tu propuesta.",
    siteName: "Soporte Dinámico Industrial",
  },
}

export default function ConcursoPage() {
  return <ConcursoView />
}
