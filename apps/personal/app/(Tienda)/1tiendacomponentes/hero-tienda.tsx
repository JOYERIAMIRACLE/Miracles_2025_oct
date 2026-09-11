import Link from 'next/link'

const HeroTienda = () => {
  return (
    <div className="relative w-full h-[52vh] md:h-[62vh] overflow-hidden bg-slate-900">

      {/* Imagen de fondo */}
      <img
        src="/portada%20home.jpg.jpg"
        alt="Medalla de Oro — Joyería fina"
        className="absolute inset-0 w-full h-full object-cover object-right"
      />

      {/* Overlay degradado izquierda + oscuro */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />

      {/* Contenido alineado a la izquierda */}
      <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-20 max-w-6xl mx-auto">

        <p className="text-amber-400 text-[11px] font-bold uppercase tracking-[0.3em] mb-3">
          Colección 2026
        </p>

        <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight max-w-lg drop-shadow-md">
          Joyería fina<br />en Oro y Plata
        </h1>

        <p className="text-white/65 mt-3 text-sm md:text-base max-w-xs md:max-w-sm leading-relaxed">
          Piezas únicas en Oro 10k y Plata&nbsp;925. Diseños para cada ocasión especial.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-7">
          <Link
            href="/category/cadenas"
            className="inline-flex items-center justify-center px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold uppercase tracking-widest transition-colors"
          >
            Explorar catálogo
          </Link>
          <Link
            href="/nosotros"
            className="inline-flex items-center justify-center px-8 py-3 border border-white/50 text-white text-[11px] font-semibold uppercase tracking-widest hover:bg-white/10 transition-colors"
          >
            Conocer más
          </Link>
        </div>
      </div>
    </div>
  )
}

export default HeroTienda
