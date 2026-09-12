import Link from "next/link"

// Todos los canales son enlaces directos — ya no abre un mini-formulario
// (el que existía para Mostrador/Vendedor se quitó junto con esos dos
// botones, que cambiaron de propósito: Mostrador ahora es "Ver ubicación"
// y Vendedor se volvió "Soy distribuidor", con landing propia).
export default function ContactoRapido() {
  return (
    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4">
      <a
        href="https://wa.me/"
        target="_blank" rel="noopener noreferrer"
        className="text-white/50 hover:text-white text-[10px] tracking-widest uppercase transition-colors"
      >
        WhatsApp
      </a>
      <a
        href="https://instagram.com/"
        target="_blank" rel="noopener noreferrer"
        className="text-white/50 hover:text-white text-[10px] tracking-widest uppercase transition-colors"
      >
        Instagram
      </a>
      <a
        href="https://facebook.com/"
        target="_blank" rel="noopener noreferrer"
        className="text-white/50 hover:text-white text-[10px] tracking-widest uppercase transition-colors"
      >
        Facebook
      </a>
      <a
        href="tel:+521XXXXXXXXXX"
        className="text-white/50 hover:text-white text-[10px] tracking-widest uppercase transition-colors"
      >
        Llamar
      </a>
      <Link
        href="/contacto"
        className="text-white/50 hover:text-white text-[10px] tracking-widest uppercase transition-colors"
      >
        Enviar correo
      </Link>
      {/* Placeholder hasta tener la dirección real de la tienda — busca el
          negocio por nombre en vez de apuntar a coordenadas inventadas. */}
      <a
        href="https://www.google.com/maps/search/?api=1&query=Medalla+de+Oro+Joyer%C3%ADa"
        target="_blank" rel="noopener noreferrer"
        className="text-white/50 hover:text-white text-[10px] tracking-widest uppercase transition-colors"
      >
        Ver ubicación
      </a>
      <Link
        href="/distribuidor"
        className="text-white/50 hover:text-white text-[10px] tracking-widest uppercase transition-colors"
      >
        Soy distribuidor
      </Link>
    </div>
  )
}
