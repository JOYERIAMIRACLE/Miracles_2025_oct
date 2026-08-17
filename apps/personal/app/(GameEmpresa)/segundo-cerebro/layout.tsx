import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: { absolute: "Segundo Cerebro" },
}

export default function SegundoCerebroLayout({ children }: { children: ReactNode }) {
  return <div className="dark">{children}</div>
}
