"use client"

import Link from "next/link"
import { useState, FormEvent } from "react"

const INTERESES = [
  "Anillo",
  "Cadena",
  "Aretes",
  "Dije",
  "Pulsera",
  "Regalo personalizado",
  "Otro",
]

type Estado = "idle" | "enviando" | "exito" | "error"

export default function ContactoPage() {
  const [nombre,   setNombre]   = useState("")
  const [telefono, setTelefono] = useState("")
  const [email,    setEmail]    = useState("")
  const [interes,  setInteres]  = useState("")
  const [mensaje,  setMensaje]  = useState("")
  const [estado,   setEstado]   = useState<Estado>("idle")
  const [errMsg,   setErrMsg]   = useState("")

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setEstado("enviando")
    setErrMsg("")

    const STRAPI = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:1337"

    try {
      // 1. Crear cliente
      const clienteRes = await fetch(`${STRAPI}/api/clientes`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            nombre:         nombre.trim(),
            telefono:       telefono.trim(),
            email:          email.trim() || null,
            origenContacto: "Web",
            canalContacto:  "Formulario",
          },
        }),
      })
      const clienteJson = await clienteRes.json()
      if (!clienteRes.ok || !clienteJson?.data) {
        setErrMsg(clienteJson?.error?.message ?? "Error al registrar contacto.")
        setEstado("error")
        return
      }

      // 2. Crear lead vinculado
      const leadRes = await fetch(`${STRAPI}/api/leads`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            cliente:        { connect: [{ id: clienteJson.data.id }] },
            Funnel:         "Lead",
            origenApp:      "tienda",
            origenContacto: "Web",
            canalContacto:  "Formulario de contacto",
            campanaOrigen:  interes ? `Interés: ${interes}` : undefined,
            notas:          mensaje.trim() || null,
            fechaLead:      new Date().toISOString(),
          },
        }),
      })
      const leadJson = await leadRes.json()
      if (!leadRes.ok || !leadJson?.data) {
        setErrMsg(leadJson?.error?.message ?? "Error al procesar solicitud.")
        setEstado("error")
        return
      }

      setEstado("exito")
      setNombre(""); setTelefono(""); setEmail("")
      setInteres(""); setMensaje("")
    } catch {
      setErrMsg("No se pudo conectar con el servidor.")
      setEstado("error")
    }
  }

  return (
    <article className="max-w-2xl mx-auto px-6 sm:px-8 py-12">

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-amber-600">Inicio</Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-300">Contacto</span>
      </nav>

      {/* Encabezado */}
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
          Escríbenos
        </p>
        <h1 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight">
          ¿Tienes una pregunta o quieres una pieza especial?
        </h1>
        <p className="mt-4 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
          Déjanos tus datos y con gusto te contactamos. Respondemos por WhatsApp o correo en menos de 24 horas.
        </p>
      </header>

      {/* Formulario */}
      {estado === "exito" ? (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 p-10 text-center">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            ¡Mensaje recibido!
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Gracias por contactarnos. Te escribiremos pronto.
          </p>
          <button
            onClick={() => setEstado("idle")}
            className="text-sm text-amber-600 dark:text-amber-400 underline"
          >
            Enviar otro mensaje
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Tu nombre completo"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              WhatsApp / Teléfono <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              placeholder="10 dígitos"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Correo electrónico <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Interés */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ¿Qué tipo de joya te interesa? <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <select
              value={interes}
              onChange={e => setInteres(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Seleccionar...</option>
              {INTERESES.map(i => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>

          {/* Mensaje */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mensaje <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              rows={4}
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              placeholder="Cuéntanos qué buscas, si es un regalo, medida, etc."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* Error */}
          {estado === "error" && (
            <p className="text-sm text-red-600 dark:text-red-400">{errMsg}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={estado === "enviando"}
            className="w-full rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 px-6 py-3 text-sm font-semibold text-white transition-colors"
          >
            {estado === "enviando" ? "Enviando…" : "Enviar mensaje"}
          </button>

          <p className="text-xs text-center text-gray-400">
            Al enviar este formulario aceptas que nos pongamos en contacto contigo.
          </p>
        </form>
      )}

      {/* Datos adicionales */}
      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 grid sm:grid-cols-2 gap-6 text-sm text-gray-600 dark:text-gray-400">
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">WhatsApp</p>
          <p>También puedes escribirnos directamente y te respondemos al momento.</p>
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Envíos</p>
          <p>Enviamos a todo México con paquetería de confianza.</p>
        </div>
      </div>

    </article>
  )
}
