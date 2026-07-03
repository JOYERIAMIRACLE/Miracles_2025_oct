"use client"

import { useState } from "react"
import Image from "next/image"
import { Send, CheckCircle, Loader2, Users, Target, Link as LinkIcon } from "lucide-react"

const STRAPI = process.env.NEXT_PUBLIC_BACKEND_URL ?? "https://miracles2025oct-production.up.railway.app"

type Estado = "idle" | "loading" | "ok" | "error"

export function ConcursoView() {
  const [nombre_equipo, setNombreEquipo] = useState("")
  const [integrantes,   setIntegrantes]  = useState("")
  const [objetivo,      setObjetivo]     = useState("")
  const [link_archivo,  setLinkArchivo]  = useState("")
  const [estado, setEstado] = useState<Estado>("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre_equipo || !integrantes || !objetivo) return
    setEstado("loading")
    setErrorMsg("")
    try {
      const res = await fetch(`${STRAPI}/api/propuesta-concursos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { nombre_equipo, integrantes, objetivo, link_archivo } }),
      })
      if (res.ok) {
        setEstado("ok")
      } else {
        setErrorMsg("No se pudo enviar. Intenta de nuevo.")
        setEstado("error")
      }
    } catch {
      setErrorMsg("Error de conexión.")
      setEstado("error")
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col">

      {/* Triángulo decorativo */}
      <div className="absolute bottom-0 right-0 pointer-events-none"
        style={{ width:0,height:0,borderStyle:"solid",borderWidth:"0 0 300px 260px",borderColor:"transparent transparent #ED8000 transparent",opacity:0.15 }} />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-12">
            <div className="shrink-0 w-20 h-20">
              <Image src="/logo-3s.png" alt="SDI" width={80} height={80} className="w-full h-full object-contain" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ED8000] mb-1">Concurso interno</p>
              <h1 className="text-3xl sm:text-4xl font-black leading-tight">
                Somos Diferentes<br />
                <span className="text-[#ED8000]">Innovando</span>
              </h1>
              <p className="text-white/40 text-sm mt-2">Comparte tu propuesta y muestra tu mejor versión</p>
            </div>
          </div>

          {/* Éxito */}
          {estado === "ok" ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <CheckCircle className="h-16 w-16 text-[#ED8000]" />
              <h2 className="text-2xl font-black">¡Propuesta enviada!</h2>
              <p className="text-white/50 max-w-sm">Tu propuesta fue registrada. El equipo la revisará pronto.</p>
              <button type="button" onClick={() => { setEstado("idle"); setNombreEquipo(""); setIntegrantes(""); setObjetivo(""); setLinkArchivo("") }}
                className="mt-4 px-5 py-2.5 rounded-xl border border-white/20 text-white/60 hover:text-white text-sm transition-colors">
                Enviar otra propuesta
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Nombre del equipo */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40 mb-2">
                  <Users className="h-3.5 w-3.5" /> Nombre del equipo
                </label>
                <input type="text" value={nombre_equipo} onChange={e => setNombreEquipo(e.target.value)} required
                  placeholder="Ej. Equipo Innovación Norte"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#ED8000] transition-colors" />
              </div>

              {/* Integrantes */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40 mb-2">
                  <Users className="h-3.5 w-3.5" /> Integrantes
                </label>
                <textarea value={integrantes} onChange={e => setIntegrantes(e.target.value)} required rows={3}
                  placeholder="Escribe los nombres separados por comas o uno por línea"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#ED8000] transition-colors resize-none" />
              </div>

              {/* Objetivo */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40 mb-2">
                  <Target className="h-3.5 w-3.5" /> Objetivo de la propuesta
                </label>
                <textarea value={objetivo} onChange={e => setObjetivo(e.target.value)} required rows={4}
                  placeholder="¿Qué problema resuelve? ¿Qué mejoraría? ¿Cómo impacta al equipo o al cliente?"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#ED8000] transition-colors resize-none" />
              </div>

              {/* Link archivo */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40 mb-2">
                  <LinkIcon className="h-3.5 w-3.5" /> Link del archivo <span className="normal-case font-normal">(opcional)</span>
                </label>
                <input type="url" value={link_archivo} onChange={e => setLinkArchivo(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#ED8000] transition-colors" />
              </div>

              {errorMsg && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{errorMsg}</p>
              )}

              <button type="submit" disabled={estado === "loading"}
                className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 text-white"
                style={{ background: "linear-gradient(135deg,#c46800,#ED8000)" }}>
                {estado === "loading"
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                  : <><Send className="h-4 w-4" /> Enviar propuesta</>
                }
              </button>

              <p className="text-white/20 text-[11px] text-center">
                Tu propuesta queda registrada para revisión del equipo SDI.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
