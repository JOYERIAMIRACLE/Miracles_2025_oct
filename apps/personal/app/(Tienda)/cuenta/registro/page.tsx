"use client"
import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2, Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react"
import { toast } from "sonner"
import { registrarCliente } from "@/api/tiendaAuth/registro"
import { setClienteToken, getClienteToken, isClienteTokenValid } from "@/lib/tiendaAuth"

function RegistroForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next") || "/"

  const [nombre,       setNombre]       = useState("")
  const [email,        setEmail]        = useState("")
  const [telefono,     setTelefono]     = useState("")
  const [password,     setPassword]     = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState("")

  useEffect(() => {
    if (isClienteTokenValid(getClienteToken())) router.replace(next)
  }, [router, next])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return }
    setLoading(true)
    setError("")
    try {
      const { jwt } = await registrarCliente({ nombre: nombre.trim(), email: email.trim(), password, telefono: telefono.trim() || null })
      setClienteToken(jwt)
      toast.success("¡Cuenta creada!")
      router.push(next)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-amber-600">Inicio</Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-300">Crear cuenta</span>
      </nav>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="mb-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Crear cuenta</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Necesitas una cuenta para continuar con tu compra.</p>
        </div>

        <div>
          <label htmlFor="nombre" className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Nombre completo</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
            <input
              id="nombre" type="text" value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Tu nombre" required autoFocus autoComplete="name"
              className="w-full h-10 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all"
            />
          </div>
        </div>
        <div>
          <label htmlFor="email" className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
            <input
              id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com" required autoComplete="email"
              className="w-full h-10 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all"
            />
          </div>
        </div>
        <div>
          <label htmlFor="telefono" className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Teléfono <span className="text-gray-400 dark:text-gray-600">(opcional)</span></label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
            <input
              id="telefono" type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
              placeholder="55 0000 0000" autoComplete="tel"
              className="w-full h-10 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all"
            />
          </div>
        </div>
        <div>
          <label htmlFor="password" className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
            <input
              id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres" required autoComplete="new-password"
              className="w-full h-10 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-10 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all"
            />
            <button type="button" onClick={() => setShowPassword(p => !p)} tabIndex={-1}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-xs text-red-600 dark:text-red-400 leading-relaxed bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading}
          className="w-full h-10 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? "Creando cuenta…" : "Crear cuenta"}
        </button>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          ¿Ya tienes cuenta?{" "}
          <Link href={`/cuenta/login?next=${encodeURIComponent(next)}`} className="text-amber-600 dark:text-amber-400 font-medium hover:text-amber-700 dark:hover:text-amber-300">
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  )
}

export default function RegistroPage() {
  return (
    <Suspense fallback={null}>
      <RegistroForm />
    </Suspense>
  )
}
