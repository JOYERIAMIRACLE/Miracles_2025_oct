"use client"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2, Lock, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { confirmarResetPassword } from "@/api/auth/resetPassword"
import { setToken, setUserRole, setSessionCookie, fetchUserRole } from "@/lib/auth"
import { setClienteToken } from "@/lib/tiendaAuth"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? ""

// Página compartida entre el Portal (staff) y la Tienda (clientes) — el
// endpoint de Strapi que emite el link de reset es global, no distingue rol,
// así que no se sabe de antemano quién la va a abrir. Al terminar, se
// consulta el rol real con el JWT devuelto y se decide a dónde mandar a la
// persona (mismo patrón que ya usa app/login/page.tsx).
function RestablecerForm() {
  const router = useRouter()
  const params = useSearchParams()
  const code   = params.get("code") || ""

  const [password,     setPassword]     = useState("")
  const [confirmacion,  setConfirmacion] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!code) {
      setError("El link no es válido. Solicita uno nuevo.")
      return
    }
    if (password !== confirmacion) {
      setError("Las contraseñas no coinciden")
      return
    }
    setLoading(true)
    try {
      const { jwt } = await confirmarResetPassword(code, password, confirmacion)
      const role = await fetchUserRole(jwt, BASE)

      if (role === "authenticated") {
        setToken(jwt)
        setUserRole(role)
        setSessionCookie()
        toast.success("Contraseña actualizada")
        router.push("/portal-medalladeoro")
      } else {
        setClienteToken(jwt)
        toast.success("Contraseña actualizada")
        router.push("/cuenta")
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="mb-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Nueva contraseña</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Escribe tu nueva contraseña dos veces.</p>
        </div>

        <div>
          <label htmlFor="password" className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Contraseña nueva</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
            <input
              id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required minLength={6} autoFocus autoComplete="new-password"
              className="w-full h-10 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-10 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400/50 transition-all"
            />
            <button type="button" onClick={() => setShowPassword(p => !p)} tabIndex={-1}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmacion" className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Confirmar contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
            <input
              id="confirmacion" type={showPassword ? "text" : "password"} value={confirmacion} onChange={e => setConfirmacion(e.target.value)}
              placeholder="••••••••" required minLength={6} autoComplete="new-password"
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
          {loading ? "Guardando…" : "Guardar y entrar"}
        </button>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          <Link href="/portal/login" className="text-violet-600 dark:text-violet-400 font-medium hover:text-violet-700 dark:hover:text-violet-300">
            Volver a iniciar sesión
          </Link>
        </p>
      </form>
    </div>
  )
}

export default function RestablecerPasswordPage() {
  return (
    <Suspense fallback={null}>
      <RestablecerForm />
    </Suspense>
  )
}
