"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Loader2, Mail, ArrowLeft, Sparkles } from "lucide-react"
import { solicitarResetPassword } from "@/api/auth/resetPassword"
import { useGetIdentidad } from "@/api/identidad-empresa/getIdentidad"

// Logo en badge blanco — asegura contraste/legibilidad sin importar los
// colores internos del logo real (identidad-empresa.logo). Si todavía no
// se ha subido, el mismo badge cae al ícono genérico de respaldo.
function LoginBrandMark({ logoUrl }: { logoUrl?: string | null }) {
  return (
    <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-white shadow-lg shadow-black/30 shrink-0 transition-transform group-hover:scale-105">
      {logoUrl
        ? <img src={logoUrl} alt="Medalla de oro" className="h-9 w-9 object-contain" />
        : <Sparkles className="h-7 w-7 text-violet-600" />}
    </div>
  )
}

export default function OlvidePasswordPage() {
  const { identidad } = useGetIdentidad()
  const [email,   setEmail]   = useState("")
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error,   setError]   = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await solicitarResetPassword(email)
      setEnviado(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dark h-dvh bg-[#121212] text-white flex flex-col lg:flex-row overflow-y-auto relative">
      {/* Video de fondo — textura sutil, muy baja opacidad para no competir
          con el formulario. poster = primer frame ya optimizado, para que
          se vea algo de inmediato mientras carga el .mp4 (~1MB). */}
      <video autoPlay loop muted playsInline poster="/login-bg-poster.jpg"
        className="absolute inset-0 w-full h-full object-cover opacity-[0.07] pointer-events-none">
        <source src="/login-bg.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_25%,rgba(124,58,237,0.12),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_85%_75%,rgba(124,58,237,0.07),transparent)] pointer-events-none" />

      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 xl:px-24 relative z-10">
        <div className="group flex items-center gap-3 w-fit mb-10">
          <LoginBrandMark logoUrl={identidad?.logo?.url} />
          <div className="text-left min-w-0">
            <div className="text-xl xl:text-2xl font-bold text-white leading-tight">Portal Medalla de Oro</div>
            <div className="text-sm text-white/50 leading-tight mt-0.5">Joyería Medalla de Oro</div>
          </div>
        </div>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-white/50 text-base leading-relaxed max-w-md"
        >
          Te mandamos un link a tu correo para que puedas crear una contraseña nueva.
        </motion.p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:py-0 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-sm"
        >
          <div className="group flex lg:hidden items-center justify-center gap-3 mb-8">
            <LoginBrandMark logoUrl={identidad?.logo?.url} />
            <div className="text-left">
              <div className="text-lg font-bold text-zinc-100 leading-tight">Portal Medalla de Oro</div>
              <div className="text-xs text-zinc-400 leading-tight mt-0.5">Joyería Medalla de Oro</div>
            </div>
          </div>

          {enviado ? (
            <div className="bg-zinc-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xl shadow-black/40 text-center">
              <h1 className="text-lg font-bold text-zinc-100">Revisa tu correo</h1>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Si <span className="text-zinc-200 font-medium">{email}</span> tiene una cuenta, te llegará un link para restablecer tu contraseña.
              </p>
              <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 font-medium">
                <ArrowLeft size={14} /> Volver a iniciar sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-zinc-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xl shadow-black/40">
              <div className="mb-2">
                <h1 className="text-lg font-bold text-zinc-100">Recuperar contraseña</h1>
                <p className="text-sm text-zinc-500 mt-0.5">Ingresa tu correo y te mandamos un link para restablecerla.</p>
              </div>

              <div>
                <label htmlFor="email" className="text-xs font-medium text-zinc-400 mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                  <input
                    id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="tu@email.com" required autoFocus autoComplete="email"
                    className="w-full h-10 rounded-lg border border-zinc-700 bg-zinc-800 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400/50 transition-all"
                  />
                </div>
              </div>

              {error && (
                <p role="alert" className="text-xs text-red-400 leading-relaxed bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full h-10 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                {loading ? "Enviando…" : "Enviar link"}
              </button>

              <p className="text-center text-xs text-zinc-500">
                <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium inline-flex items-center gap-1">
                  <ArrowLeft size={12} /> Volver a iniciar sesión
                </Link>
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  )
}
