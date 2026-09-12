"use client"
import { useState, FormEvent } from "react"
import Link from "next/link"
import { X } from "lucide-react"

type Canal = "Vendedor" | "Mostrador" | "Teléfono" | "Correo"

type FormState = {
  nombre:    string
  telefono:  string
  vendedor:  string
}

const STRAPI = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

export default function ContactoRapido() {
  const [canal,    setCanal]   = useState<Canal | null>(null)
  const [form,     setForm]    = useState<FormState>({ nombre: "", telefono: "", vendedor: "" })
  const [enviando, setEnviando] = useState(false)
  const [exito,    setExito]   = useState(false)
  const [error,    setError]   = useState("")

  const abrirCanal = (c: Canal) => {
    setCanal(c); setExito(false); setError("")
    setForm({ nombre: "", telefono: "", vendedor: "" })
  }

  const cerrar = () => { setCanal(null); setExito(false); setError("") }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.nombre || !form.telefono) return
    setEnviando(true); setError("")
    try {
      const body: Record<string, string | null> = {
        nombre:   form.nombre.trim(),
        telefono: form.telefono.trim(),
        canal:    canal,
        interes:  null,
        mensaje:  null,
        vendedor: canal === "Vendedor" ? (form.vendedor.trim() || null) : null,
      }

      const res  = await fetch(`${STRAPI}/api/tienda/contacto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j?.error?.message ?? "Error al enviar")
      }
      setExito(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar")
    } finally {
      setEnviando(false)
    }
  }

  const inp = "w-full bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm rounded px-3 py-2 outline-none focus:border-amber-400 transition-colors"

  return (
    <>
      {/* Fila de canales */}
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
          Teléfono
        </a>
        <Link
          href="/contacto"
          className="text-white/50 hover:text-white text-[10px] tracking-widest uppercase transition-colors"
        >
          Correo
        </Link>
        <button
          onClick={() => abrirCanal("Vendedor")}
          className="text-white/50 hover:text-white text-[10px] tracking-widest uppercase transition-colors"
        >
          Vendedor
        </button>
        <button
          onClick={() => abrirCanal("Mostrador")}
          className="text-white/50 hover:text-white text-[10px] tracking-widest uppercase transition-colors"
        >
          Mostrador
        </button>
      </div>

      {/* Mini-formulario overlay */}
      {canal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-4 sm:pb-0">
          <div className="w-full max-w-sm bg-slate-900/95 border border-white/10 rounded-2xl p-6 shadow-2xl">

            {/* Cabecera */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[10px] tracking-widest uppercase text-amber-400 font-semibold mb-0.5">
                  {canal === "Vendedor" ? "Referido por vendedor" : "Llegaste al mostrador"}
                </p>
                <h3 className="text-white font-bold text-base leading-tight">
                  {canal === "Vendedor"
                    ? "¿Qué vendedor te refirió?"
                    : "Déjanos tus datos"}
                </h3>
              </div>
              <button onClick={cerrar} className="text-white/40 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {exito ? (
              <div className="text-center py-4">
                <p className="text-2xl mb-2">✓</p>
                <p className="text-white font-semibold mb-1">¡Registrado!</p>
                <p className="text-white/60 text-sm">Te contactamos pronto.</p>
                <button
                  onClick={cerrar}
                  className="mt-4 text-amber-400 text-sm underline"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-white/50 uppercase tracking-wide mb-1">
                    Tu nombre <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    value={form.nombre}
                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    placeholder="Nombre completo"
                    className={inp}
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-white/50 uppercase tracking-wide mb-1">
                    WhatsApp / Teléfono <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    type="tel"
                    value={form.telefono}
                    onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                    placeholder="10 dígitos"
                    className={inp}
                  />
                </div>

                {canal === "Vendedor" && (
                  <div>
                    <label className="block text-[10px] text-white/50 uppercase tracking-wide mb-1">
                      ¿Qué vendedor te refirió?
                    </label>
                    <input
                      value={form.vendedor}
                      onChange={e => setForm(f => ({ ...f, vendedor: e.target.value }))}
                      placeholder="Nombre del vendedor…"
                      className={inp}
                    />
                  </div>
                )}

                {error && (
                  <p className="text-red-400 text-xs">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full mt-1 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-widest rounded transition-colors"
                >
                  {enviando ? "Enviando…" : "Enviar"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
