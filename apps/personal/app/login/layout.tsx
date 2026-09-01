import type { ReactNode } from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: { absolute: "Iniciar sesión — Medalla de oro" },
}

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children
}
