import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Facebook, Mail, MessageCircle } from 'lucide-react'
import { Separator } from '../../../components/ui/separator'

// Enlaces reales del sitio — antes estos 4 eran placeholders (href="#",
// incluido un typo "sobrenomberw") que no llevaban a ningún lado.
const enlacesTienda = [
    { name: "Catálogo", href: "/tienda" },
    { name: "Blog", href: "/blog" },
    { name: "Nosotros", href: "/nosotros" },
]
const enlacesLegal = [
    { name: "Términos y condiciones", href: "/terminos" },
    { name: "Política de privacidad", href: "/privacidad" },
    { name: "Envíos", href: "/envios" },
    { name: "Devoluciones", href: "/devoluciones" },
]

// Contacto: aún no existen cuentas/número reales del negocio — se deja un
// correo de marcador de posición (seguro, un mailto mal dirigido no molesta
// a nadie) y los íconos de redes van a las páginas genéricas de cada
// plataforma en vez de inventar un número de WhatsApp o @usuario que podría
// coincidir con una cuenta real de otra persona. Reemplazar en cuanto existan
// las cuentas reales del negocio.
const CONTACTO_EMAIL = "contacto@medalladeoro.com.mx"

const linkCls = "text-sm text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
const iconLinkCls = "flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:text-amber-600 hover:border-amber-300 dark:hover:text-amber-400 dark:hover:border-amber-800 transition-colors"

const Footer = () => {
  return (
    <footer className="mt-4 bg-white dark:bg-zinc-950 border-t border-gray-100 dark:border-gray-900">
      <div className="w-full max-w-6xl mx-auto p-6 px-6 sm:px-14 md:py-12">

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* LOGO Y TAGLINE */}
          <div className="lg:col-span-1">
            <Image
              src="/logo medallita de oro fondo blanco.png"
              alt="Medalla de Oro"
              width={170}
              height={54}
              className="object-contain object-left block dark:hidden"
            />
            <Image
              src="/logo oficial oficial.png"
              alt="Medalla de Oro"
              width={170}
              height={54}
              className="object-contain object-left hidden dark:block"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 max-w-xs">
              Joyería fina en oro 10k y plata 925, hecha con calidad · Envíos a todo México.
            </p>
          </div>

          {/* TIENDA */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Tienda</h3>
            <ul className="flex flex-col gap-2.5">
              {enlacesTienda.map(item => (
                <li key={item.href}><Link href={item.href} className={linkCls}>{item.name}</Link></li>
              ))}
            </ul>
          </div>

          {/* LEGAL */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Legal</h3>
            <ul className="flex flex-col gap-2.5">
              {enlacesLegal.map(item => (
                <li key={item.href}><Link href={item.href} className={linkCls}>{item.name}</Link></li>
              ))}
            </ul>
          </div>

          {/* CONTACTO */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Contacto</h3>
            <a href={`mailto:${CONTACTO_EMAIL}`} className={`${linkCls} flex items-center gap-2`}>
              <Mail size={14} /> {CONTACTO_EMAIL}
            </a>
            <div className="flex items-center gap-2 mt-4">
              <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className={iconLinkCls}>
                <MessageCircle size={16} />
              </a>
              <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={iconLinkCls}>
                <Instagram size={16} />
              </a>
              <a href="https://facebook.com/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={iconLinkCls}>
                <Facebook size={16} />
              </a>
            </div>
          </div>
        </div>

        <Separator className="my-6 border-gray-200 dark:border-gray-800 lg:my-8" />

        <p className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
          &copy; {new Date().getFullYear()} Medalla de Oro — Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}

export default Footer
