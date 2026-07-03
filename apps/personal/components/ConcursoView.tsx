"use client"

import { useState } from "react"
import Image from "next/image"
import { Send, CheckCircle, Loader2, Users, Target, Link as LinkIcon, Trophy, Star, ChevronDown } from "lucide-react"

const STRAPI = process.env.NEXT_PUBLIC_BACKEND_URL ?? "https://miracles2025oct-production.up.railway.app"

type Estado = "idle" | "loading" | "ok" | "error"

const etapas = [
  { etapa: "Top 3 Ideas", premio: "$500 — Tarjeta de regalo Amazon" },
  { etapa: "Idea implementada como piloto", premio: "$2,000 pesos" },
  { etapa: "Idea que genera resultado medible", premio: "Bono variable — 5% de la utilidad neta generada en 12 meses" },
]

const criterios = [
  { criterio: "Impacto en ventas o margen", pts: 30 },
  { criterio: "Facilidad de implementación", pts: 20 },
  { criterio: "Rapidez para probarla / implementarla", pts: 15 },
  { criterio: "Costo / Riesgo", pts: 15 },
  { criterio: "Claridad de la idea", pts: 10 },
  { criterio: "Escalabilidad", pts: 10 },
]

const reglas = [
  "La idea debe ser aplicable al negocio.",
  "Puede ser individual.",
  "La empresa decide si implementa o no la idea.",
  "El bono aplica solo si el resultado es medible.",
  "El bono se calcula sobre utilidad neta de la iniciativa.",
  "El periodo de medición será de 12 meses.",
  "El bono máximo será de $100,000 pesos por idea (menos impuestos).",
  "Las ideas pasan a ser propiedad de la empresa una vez presentadas.",
]

const comite = ["Dirección general", "Comercial / ventas", "Operaciones", "Finanzas", "Persona neutral (TBD)"]

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
    <div className="relative min-h-screen bg-[#111] text-white">

      {/* Hero */}
      <div className="relative overflow-hidden bg-[#1a1a1a] px-6 py-16 flex flex-col items-center text-center">
        <div className="w-20 h-20 mb-6">
          <Image src="/logo-3s.png" alt="SDI" width={80} height={80} className="w-full h-full object-contain" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ED8000] mb-2">Concurso interno · SDI</p>
        <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-3">
          Somos Diferentes<br /><span className="text-[#ED8000]">Innovando</span>
        </h1>
        <p className="text-white/60 text-base max-w-md">
          Comparte tu propuesta y muestra tu mejor versión
        </p>
        <div className="mt-8 text-white/20">
          <ChevronDown className="h-5 w-5 animate-bounce mx-auto" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-14">

        {/* Objetivo */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#ED8000] mb-4">Objetivo del concurso</h2>
          <p className="text-white/70 mb-4">Invitar a todos los colaboradores a proponer ideas para:</p>
          <ul className="space-y-2">
            {["Incrementar ventas.", "Vender a clientes nuevos.", "Abrir nuevos canales o negocio de venta."].map(i => (
              <li key={i} className="flex items-start gap-3 text-white">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#ED8000] shrink-0" />
                {i}
              </li>
            ))}
          </ul>
        </section>

        <div className="w-full h-px bg-white/8" />

        {/* Etapas y reconocimientos */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#ED8000] mb-6 flex items-center gap-2">
            <Trophy className="h-3.5 w-3.5" /> Etapas y reconocimientos
          </h2>
          <div className="space-y-3">
            {etapas.map((e, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 bg-white/4 border border-white/8 rounded-xl px-5 py-4">
                <div className="flex items-center gap-3 sm:w-1/2">
                  <span className="text-[#ED8000] font-black text-lg leading-none">{i + 1}</span>
                  <span className="text-white font-medium text-sm">{e.etapa}</span>
                </div>
                <span className="text-[#ED8000] font-semibold text-sm sm:text-right sm:w-1/2">{e.premio}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="w-full h-px bg-white/8" />

        {/* Criterios */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#ED8000] mb-2 flex items-center gap-2">
            <Star className="h-3.5 w-3.5" /> Criterios de evaluación
          </h2>
          <p className="text-white/40 text-sm mb-6">Matriz de 100 puntos</p>
          <div className="space-y-2">
            {criterios.map((c) => (
              <div key={c.criterio} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-white/80 text-sm">{c.criterio}</span>
                    <span className="text-[#ED8000] font-bold text-sm">{c.pts} pts</span>
                  </div>
                  <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#ED8000]/70" style={{ width: `${c.pts}%` }} />
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-3 border-t border-white/10 mt-4">
              <span className="text-white font-bold text-sm">Total</span>
              <span className="text-[#ED8000] font-black text-sm">100 pts</span>
            </div>
          </div>

          {/* Comité */}
          <div className="mt-8 bg-white/4 border border-white/8 rounded-xl px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Comité evaluador</p>
            <ul className="space-y-1.5">
              {comite.map(m => (
                <li key={m} className="flex items-center gap-2 text-white/70 text-sm">
                  <span className="h-1 w-1 rounded-full bg-[#ED8000] shrink-0" />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="w-full h-px bg-white/8" />

        {/* Reglas */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#ED8000] mb-6">Reglas</h2>
          <ol className="space-y-3">
            {reglas.map((r, i) => (
              <li key={i} className="flex gap-3 text-white/70 text-sm">
                <span className="text-[#ED8000] font-bold shrink-0">{i + 1}.</span>
                {r}
              </li>
            ))}
          </ol>
        </section>

        <div className="w-full h-px bg-white/8" />

        {/* Formulario */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#ED8000] mb-2">Envía tu propuesta</h2>
          <p className="text-white/40 text-sm mb-8">Completa el formulario y el equipo SDI la revisará.</p>

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
              <div>
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40 mb-2">
                  <Users className="h-3.5 w-3.5" /> Nombre del equipo
                </label>
                <input type="text" value={nombre_equipo} onChange={e => setNombreEquipo(e.target.value)} required
                  placeholder="Ej. Equipo Innovación Norte"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#ED8000] transition-colors" />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40 mb-2">
                  <Users className="h-3.5 w-3.5" /> Integrantes
                </label>
                <textarea value={integrantes} onChange={e => setIntegrantes(e.target.value)} required rows={3}
                  placeholder="Escribe los nombres separados por comas o uno por línea"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#ED8000] transition-colors resize-none" />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40 mb-2">
                  <Target className="h-3.5 w-3.5" /> Objetivo de la propuesta
                </label>
                <textarea value={objetivo} onChange={e => setObjetivo(e.target.value)} required rows={4}
                  placeholder="¿Qué problema resuelve? ¿Qué mejoraría? ¿Cómo impacta al equipo o al cliente?"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#ED8000] transition-colors resize-none" />
              </div>

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
                className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 text-white bg-[#ED8000] hover:bg-[#d47200]">
                {estado === "loading"
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                  : <><Send className="h-4 w-4" /> Enviar propuesta</>
                }
              </button>

              <p className="text-white/20 text-[11px] text-center pb-8">
                Tu propuesta queda registrada para revisión del equipo SDI.
              </p>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
