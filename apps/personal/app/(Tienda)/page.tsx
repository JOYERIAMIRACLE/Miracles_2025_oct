import Image from "next/image"
import Link  from "next/link"
import type { Metadata } from "next"

const SITE_URL = "https://miracles-frontend.pages.dev"

const TITLE = "Joyería Miracles | Oro y Plata de Alta Calidad"
const DESCRIPTION = "Joyería fina en oro de 10k y plata 925: anillos, cadenas, aretes, dijes, pulsos y más. Envíos a todo México."

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Joyería Miracles",
    type: "website",
    images: [{ url: `${SITE_URL}/portada%20home.jpg.jpg`, width: 1200, height: 630, alt: "Joyería Miracles" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${SITE_URL}/portada%20home.jpg.jpg`],
  },
}

export default function HeroPage() {
  return (
    <div className="relative min-h-screen flex flex-col">

      {/* Imagen de portada */}
      <Image
        src="/portada home.jpg.jpg"
        alt="Medallita de Oro"
        fill
        className="object-cover object-center"
        priority
      />

      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/45" />

      {/* Contenido centrado */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 text-white px-6 text-center gap-6">

        {/* Logo */}
        <Image
          src="/logo oficial oficial.png"
          alt="Medallita de Oro"
          width={220}
          height={88}
          className="object-contain drop-shadow-2xl"
          priority
        />

        {/* Tagline */}
        <p className="text-sm md:text-base tracking-[0.3em] text-white/70 uppercase font-light">
          Joyería de oro y plata
        </p>

        {/* Botones CTA */}
        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <Link
            href="/tienda"
            className="px-10 py-3 border border-white/80 text-white text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-300"
          >
            Ver colección
          </Link>
          <Link
            href="/tienda"
            className="px-10 py-3 bg-amber-600/90 text-white text-xs tracking-widest uppercase hover:bg-amber-700 transition-all duration-300"
          >
            Descubrir más
          </Link>
        </div>

        {/* Redes sociales */}
        <div className="flex gap-8 mt-4">
          <a
            href="https://wa.me/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-white text-[10px] tracking-widest uppercase transition-colors"
          >
            WhatsApp
          </a>
          <a
            href="https://instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-white text-[10px] tracking-widest uppercase transition-colors"
          >
            Instagram
          </a>
          <a
            href="https://facebook.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-white text-[10px] tracking-widest uppercase transition-colors"
          >
            Facebook
          </a>
        </div>
      </div>

    </div>
  )
}
