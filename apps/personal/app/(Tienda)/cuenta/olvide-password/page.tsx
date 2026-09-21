"use client"
import { useState } from "react"
import Link from "next/link"
import { Loader2, Mail, ArrowLeft } from "lucide-react"
import { solicitarResetPassword } from "@/api/auth/resetPassword"

export default function OlvidePasswordPage() {
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
    <div className="max-w-sm mx-auto px-6 py-16">
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-violet-600">Inicio</Link>
        <span>/</span>
        <Link href="/cuenta/login" className="hover:text-violet-600">Iniciar sesión</Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-300">Recuperar contraseña</span>
      </nav>

      {enviado ? (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm text-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Revisa tu correo</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Si <span className="text-gray-700 dark:text-gray-300 font-medium">{email}</span> tiene una cuenta, te llegará un link para restablecer tu contraseña.
          </p>
          <Link href="/cuenta/login" className="inline-flex items-center gap-1.5 text-sm text-violet-600 dark:text-violet-400 font-medium hover:text-violet-700 dark:hover:text-violet-300">
            <ArrowLeft size={14} /> Volver a iniciar sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="mb-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recuperar contraseña</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Ingresa tu correo y te mandamos un link para restablecerla.</p>
          </div>

          <div>
            <label htmlFor="email" className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
              <input
                id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com" required autoFocus autoComplete="email"
                className="w-full h-10 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400/50 transition-all"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400 leading-relaxed bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}
            className="w-full h-10 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? "Enviando…" : "Enviar link"}
          </button>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            <Link href="/cuenta/login" className="text-violet-600 dark:text-violet-400 font-medium hover:text-violet-700 dark:hover:text-violet-300 inline-flex items-center gap-1">
              <ArrowLeft size={12} /> Volver a iniciar sesión
            </Link>
          </p>
        </form>
      )}
    </div>
  )
}
