import Link from "next/link"
import Image from "next/image"
import { Gem, ArrowLeft } from "lucide-react"

export const metadata = { title: "En construcción" }

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center bg-background">
      <Image
        src="/logo medallita de oro fondo blanco.png"
        alt="Medallita de Oro"
        width={140}
        height={46}
        className="object-contain block dark:hidden"
      />
      <Image
        src="/logo oficial oficial.png"
        alt="Medallita de Oro"
        width={140}
        height={46}
        className="object-contain hidden dark:block"
      />

      <div className="h-12 w-12 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
        <Gem size={22} className="text-amber-500" />
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="text-2xl font-bold">Esta sección está en construcción</h1>
        <p className="text-muted-foreground">
          Estamos preparando esta parte de la tienda. Mientras tanto, puedes seguir explorando
          nuestras colecciones disponibles.
        </p>
      </div>

      <Link
        href="/"
        className="flex items-center gap-2 h-10 px-5 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-400 transition-colors"
      >
        <ArrowLeft size={16} />
        Volver al inicio
      </Link>
    </div>
  )
}
