import type { Metadata } from "next"

// Todo /cuenta/* es sesión de cliente (login, dashboard, pedidos, etc.) —
// cero valor de búsqueda y no debe indexarse. robots.ts también la bloquea,
// pero eso solo evita el rastreo; esta etiqueta evita que una página ya
// indexada por otro medio (enlace externo, redirect viejo) se quede en el
// índice de Google.
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function CuentaLayout({ children }: { children: React.ReactNode }) {
  return children
}
