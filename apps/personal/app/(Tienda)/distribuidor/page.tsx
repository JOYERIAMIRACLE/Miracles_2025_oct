"use client"

import Link from "next/link"
import { useState, FormEvent } from "react"
import { Truck, Percent, Headset, Gem } from "lucide-react"

const BENEFICIOS = [
  {
    icon:  Percent,
    title: "Precios de mayoreo",
    desc:  "Escalones de descuento según volumen de compra, para que tu margen crezca con cada pedido.",
  },
  {
    icon:  Gem,
    title: "Catálogo completo",
    desc:  "Acceso a todas las piezas en Oro 10k y Plata 925 — anillos, cadenas, dijes y más, siempre actualizado.",
  },
  {
    icon:  Truck,
    title: "Envíos a todo México",
    desc:  "Pedidos consolidados con paquetería de confianza, directo a tu negocio o bodega.",
  },
  {
    icon:  Headset,
    title: "Soporte dedicado",
    desc:  "Un contacto directo para reposiciones, piezas especiales y dudas de tu inventario.",
  },
]

type Estado = "idle" | "enviando" | "exito" | "error"

export default function DistribuidorPage() {
  const [nombre,   setNombre]   = useState("")
  const [telefono, setTelefono] = useState("")
  const [email,    setEmail]    = useState("")
  const [negocio,  setNegocio]  = useState("")
  const [mensaje,  setMensaje]  = useState("")
  const [estado,   setEstado]   = useState<Estado>("idle")
  const [errMsg,   setErrMsg]   = useState("")

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setEstado("enviando")
    setErrMsg("")

    const STRAPI = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:1337"

    try {
      const res = await fetch(`${STRAPI}/api/tienda/contacto`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre:   nombre.trim(),
          telefono: telefono.trim(),
          email:    email.trim() || null,
          canal:    "Distribuidor",
          interes:  negocio.trim() || null,
          mensaje:  mensaje.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setErrMsg(json?.error?.message ?? "Error al enviar tu solicitud.")
        setEstado("error")
        return
      }

      setEstado("exito")
      setNombre(""); setTelefono(""); setEmail("")
      setNegocio(""); setMensaje("")
    } catch {
      setErrMsg("No se pudo conectar con el servidor.")
      setEstado("error")
    }
  }

  return (
    <main>
      {/* Hero */}
      <div className="relative w-full min-h-[320px] md:h-[420px] flex items-center overflow-hidden bg-slate-900">
        <img
          src="/portada%20home.jpg.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-right opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30" />
        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 md:px-8">
          <p className="text-amber-400 text-[11px] font-bold uppercase tracking-[0.3em] mb-3">
            Programa de distribuidores
          </p>
          <h1 className="text-white text-3xl md:text-5xl font-extrabold leading-tight drop-shadow-lg max-w-2xl">
            Conviértete en distribuidor de Medalla de Oro
          </h1>
          <p className="text-white/70 mt-4 text-sm md:text-base max-w-lg">
            Lleva Oro 10k y Plata 925 a tu negocio con precios de mayoreo, catálogo completo y envíos a toda la república.
          </p>
          <a
            href="#solicitud"
            className="inline-block mt-6 px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-widest rounded transition-colors"
          >
            Quiero ser distribuidor
          </a>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-8 py-14 md:py-20">

        {/* Breadcrumb */}
        <nav className="text-xs text-slate-400 mb-10 flex items-center gap-1.5">
          <Link href="/" className="hover:text-amber-600 transition-colors">Inicio</Link>
          <span>/</span>
          <span className="text-slate-700 dark:text-slate-200">Distribuidor</span>
        </nav>

        {/* Beneficios */}
        <div className="mb-16">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-500 mb-2">
            Por qué distribuir con nosotros
          </p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-8">
            Todo lo que necesitas para vender joyería de calidad
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {BENEFICIOS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="h-11 w-11 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Formulario de solicitud */}
        <div id="solicitud" className="scroll-mt-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-500 mb-2">
            Solicita información
          </p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-6">
            Cuéntanos de tu negocio
          </h2>

          {estado === "exito" ? (
            <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 p-10 text-center">
              <div className="text-4xl mb-4">✓</div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                ¡Solicitud recibida!
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Gracias por tu interés. Un asesor te contactará pronto con precios de mayoreo.
              </p>
              <button
                onClick={() => setEstado("idle")}
                className="text-sm text-amber-600 dark:text-amber-400 underline"
              >
                Enviar otra solicitud
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Tu nombre completo"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp / Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  placeholder="10 dígitos"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Correo electrónico <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Negocio / ciudad <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={negocio}
                  onChange={e => setNegocio(e.target.value)}
                  placeholder="Nombre de tu negocio y ciudad"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Mensaje <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  rows={4}
                  value={mensaje}
                  onChange={e => setMensaje(e.target.value)}
                  placeholder="Cuéntanos qué volumen manejas o qué te interesa distribuir."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              {estado === "error" && (
                <p className="text-sm text-red-600 dark:text-red-400">{errMsg}</p>
              )}

              <button
                type="submit"
                disabled={estado === "enviando"}
                className="w-full rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 px-6 py-3 text-sm font-semibold text-white transition-colors"
              >
                {estado === "enviando" ? "Enviando…" : "Solicitar información de mayoreo"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
