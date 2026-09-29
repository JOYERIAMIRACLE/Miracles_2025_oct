"use client"

import { useState } from "react"
import { Compass, LayoutGrid, UserCircle2, ShieldCheck, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { SeccionVitrina, SeccionHeroContenido } from "./shared"
import { useGetPaginasArquitectura, useGetReglasArquitectura } from "@/api/pagina-arquitectura/getPaginasArquitectura"
import {
  createPaginaArquitectura, updatePaginaArquitectura, deletePaginaArquitectura,
  createReglaArquitectura, updateReglaArquitectura, deleteReglaArquitectura,
} from "@/api/pagina-arquitectura/mutatePaginaArquitectura"
import { GrupoArquitectura, PaginaArquitecturaType, ReglaArquitecturaType } from "@/types/pagina-arquitectura"

// Arquitectura del sitio (Portal → Operación) — antes era una página de
// documentación 100% hardcodeada en este archivo; ahora las filas viven en
// Strapi (pagina-arquitectura / regla-arquitectura) y se editan aquí mismo,
// agregar/quitar/reordenar, sin tocar código. Los 3 grupos (Landing/App/
// Cuenta) siguen siendo una taxonomía fija — eso no se edita, solo las
// páginas y reglas dentro de cada uno.

const inp  = "w-full h-8 rounded-lg border border-slate-700 bg-[#2a1b3d] px-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all"
const area = "w-full rounded-lg border border-slate-700 bg-[#2a1b3d] px-2.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-none transition-all"

type GrupoMeta = { grupo: GrupoArquitectura; titulo: string; icono: typeof Compass; resumen: string }

const GRUPOS_META: GrupoMeta[] = [
  { grupo: "landing", icono: Compass, titulo: "Landing — convencer a quien no te conoce", resumen: "De aquí sale el tráfico nuevo y la confianza. El blog y la portada mandan autoridad hacia el catálogo, nunca al revés." },
  { grupo: "app", icono: LayoutGrid, titulo: "App — convertir a quien ya quiere comprar", resumen: "Catálogo, filtros y cards de producto. No compiten por las mismas palabras que el blog — su trabajo es convertir, no atraer." },
  { grupo: "cuenta", icono: UserCircle2, titulo: "Cuenta — sesión del cliente", resumen: "Cero valor de búsqueda. Nunca debe indexarse — son páginas privadas o de entrada de sesión, no contenido para atraer visitas." },
]

function FilaPagina({ pagina, index, total, onMover, onGuardar, onBorrar }: {
  pagina: PaginaArquitecturaType; index: number; total: number
  onMover: (dir: -1 | 1) => void
  onGuardar: (campo: "ruta" | "nota", valor: string) => void
  onBorrar: () => void
}) {
  const [ruta, setRuta] = useState(pagina.ruta)
  const [nota, setNota] = useState(pagina.nota ?? "")
  const [confirmando, setConfirmando] = useState(false)

  return (
    <div className="flex items-start gap-2 px-4 py-2.5">
      <div className="flex flex-col gap-0.5 pt-0.5 shrink-0">
        <button type="button" onClick={() => onMover(-1)} disabled={index === 0} className="p-0.5 text-slate-600 hover:text-slate-300 disabled:opacity-20 disabled:pointer-events-none"><ChevronUp size={12} /></button>
        <button type="button" onClick={() => onMover(1)} disabled={index === total - 1} className="p-0.5 text-slate-600 hover:text-slate-300 disabled:opacity-20 disabled:pointer-events-none"><ChevronDown size={12} /></button>
      </div>
      <div className="flex-1 min-w-0 grid sm:grid-cols-[280px_1fr] gap-1.5">
        <input value={ruta} onChange={e => setRuta(e.target.value)}
          onBlur={() => { if (ruta !== pagina.ruta) onGuardar("ruta", ruta) }}
          className={inp + " font-mono"} placeholder="/ruta" />
        <input value={nota} onChange={e => setNota(e.target.value)}
          onBlur={() => { if (nota !== (pagina.nota ?? "")) onGuardar("nota", nota) }}
          className={inp} placeholder="Nota (opcional)…" />
      </div>
      {confirmando ? (
        <div className="flex items-center gap-1 shrink-0 pt-1.5">
          <button type="button" onClick={onBorrar} className="text-[11px] text-red-400 hover:text-red-300 font-medium">Sí</button>
          <button type="button" onClick={() => setConfirmando(false)} className="text-[11px] text-slate-500">No</button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirmando(true)} className="p-1 mt-0.5 text-slate-600 hover:text-red-400 shrink-0"><Trash2 size={13} /></button>
      )}
    </div>
  )
}

function TablaGrupoEditable({ meta, paginas, onReload }: {
  meta: GrupoMeta; paginas: PaginaArquitecturaType[]; onReload: () => void
}) {
  const Icono = meta.icono

  async function mover(index: number, dir: -1 | 1) {
    const j = index + dir
    if (j < 0 || j >= paginas.length) return
    const reordenadas = [...paginas]
    ;[reordenadas[index], reordenadas[j]] = [reordenadas[j], reordenadas[index]]
    try {
      await Promise.all(reordenadas.map((p, i) => updatePaginaArquitectura(p.documentId, { orden: i })))
      onReload()
    } catch (e) { toast.error(e instanceof Error ? e.message : "No se pudo reordenar") }
  }

  async function guardar(p: PaginaArquitecturaType, campo: "ruta" | "nota", valor: string) {
    try { await updatePaginaArquitectura(p.documentId, { [campo]: valor }) }
    catch (e) { toast.error(e instanceof Error ? e.message : "No se pudo guardar"); onReload() }
  }

  async function borrar(p: PaginaArquitecturaType) {
    try { await deletePaginaArquitectura(p.documentId); onReload() }
    catch (e) { toast.error(e instanceof Error ? e.message : "No se pudo eliminar") }
  }

  async function agregar() {
    try { await createPaginaArquitectura(meta.grupo, paginas.length); onReload() }
    catch (e) { toast.error(e instanceof Error ? e.message : "No se pudo agregar") }
  }

  return (
    <div className="rounded-xl border border-slate-800 overflow-hidden bg-[#2a1b3d]/60">
      <div className="flex items-start gap-3 p-4 bg-slate-800/30 border-b border-slate-800">
        <div className="h-9 w-9 rounded-lg bg-violet-400/10 border border-violet-400/30 flex items-center justify-center shrink-0">
          <Icono size={18} className="text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-100">{meta.titulo}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{meta.resumen}</p>
        </div>
      </div>
      <div className="divide-y divide-slate-800">
        {paginas.map((p, i) => (
          <FilaPagina key={p.documentId} pagina={p} index={i} total={paginas.length}
            onMover={dir => mover(i, dir)}
            onGuardar={(campo, valor) => guardar(p, campo, valor)}
            onBorrar={() => borrar(p)} />
        ))}
        {paginas.length === 0 && <p className="px-4 py-3 text-xs text-slate-600">Sin páginas en este grupo.</p>}
      </div>
      <div className="p-3 border-t border-slate-800">
        <button type="button" onClick={agregar}
          className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-slate-700 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors">
          <Plus size={12} /> Agregar página
        </button>
      </div>
    </div>
  )
}

function FilaRegla({ regla, index, total, onMover, onGuardar, onBorrar }: {
  regla: ReglaArquitecturaType; index: number; total: number
  onMover: (dir: -1 | 1) => void
  onGuardar: (texto: string) => void
  onBorrar: () => void
}) {
  const [texto, setTexto] = useState(regla.texto)
  const [confirmando, setConfirmando] = useState(false)

  return (
    <div className="flex items-start gap-2 py-1.5">
      <div className="flex flex-col gap-0.5 pt-1.5 shrink-0">
        <button type="button" onClick={() => onMover(-1)} disabled={index === 0} className="p-0.5 text-slate-600 hover:text-slate-300 disabled:opacity-20 disabled:pointer-events-none"><ChevronUp size={12} /></button>
        <button type="button" onClick={() => onMover(1)} disabled={index === total - 1} className="p-0.5 text-slate-600 hover:text-slate-300 disabled:opacity-20 disabled:pointer-events-none"><ChevronDown size={12} /></button>
      </div>
      <textarea rows={2} value={texto} onChange={e => setTexto(e.target.value)}
        onBlur={() => { if (texto !== regla.texto) onGuardar(texto) }}
        className={area + " flex-1"} />
      {confirmando ? (
        <div className="flex items-center gap-1 shrink-0 pt-1.5">
          <button type="button" onClick={onBorrar} className="text-[11px] text-red-400 hover:text-red-300 font-medium">Sí</button>
          <button type="button" onClick={() => setConfirmando(false)} className="text-[11px] text-slate-500">No</button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirmando(true)} className="p-1 mt-1 text-slate-600 hover:text-red-400 shrink-0"><Trash2 size={13} /></button>
      )}
    </div>
  )
}

function ListaReglasEditable({ reglas, onReload }: { reglas: ReglaArquitecturaType[]; onReload: () => void }) {
  async function mover(index: number, dir: -1 | 1) {
    const j = index + dir
    if (j < 0 || j >= reglas.length) return
    const reordenadas = [...reglas]
    ;[reordenadas[index], reordenadas[j]] = [reordenadas[j], reordenadas[index]]
    try {
      await Promise.all(reordenadas.map((r, i) => updateReglaArquitectura(r.documentId, { orden: i })))
      onReload()
    } catch (e) { toast.error(e instanceof Error ? e.message : "No se pudo reordenar") }
  }

  async function guardar(r: ReglaArquitecturaType, texto: string) {
    try { await updateReglaArquitectura(r.documentId, { texto }) }
    catch (e) { toast.error(e instanceof Error ? e.message : "No se pudo guardar"); onReload() }
  }

  async function borrar(r: ReglaArquitecturaType) {
    try { await deleteReglaArquitectura(r.documentId); onReload() }
    catch (e) { toast.error(e instanceof Error ? e.message : "No se pudo eliminar") }
  }

  async function agregar() {
    try { await createReglaArquitectura(reglas.length); onReload() }
    catch (e) { toast.error(e instanceof Error ? e.message : "No se pudo agregar") }
  }

  return (
    <div className="space-y-1">
      {reglas.map((r, i) => (
        <FilaRegla key={r.documentId} regla={r} index={i} total={reglas.length}
          onMover={dir => mover(i, dir)} onGuardar={texto => guardar(r, texto)} onBorrar={() => borrar(r)} />
      ))}
      {reglas.length === 0 && <p className="text-xs text-slate-600">Sin reglas todavía.</p>}
      <button type="button" onClick={agregar}
        className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-slate-700 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors mt-2">
        <Plus size={12} /> Agregar regla
      </button>
    </div>
  )
}

export function SeccionArquitecturaSitio() {
  const { paginas, loading: loadingPaginas, reload: reloadPaginas } = useGetPaginasArquitectura()
  const { reglas, loading: loadingReglas, reload: reloadReglas } = useGetReglasArquitectura()

  return (
    <SeccionVitrina>
      <SeccionHeroContenido
        breadcrumb={["Operación", "Arquitectura del sitio"]}
        titulo="Arquitectura del sitio"
        descripcion="Cada página pública de medalladeoro.com.mx clasificada por función — de dónde sale el tráfico nuevo, dónde se convierte, y qué nunca debe salir en Google. Se edita desde aquí, sin tocar código."
      />

      {loadingPaginas ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 rounded-xl bg-[#2a1b3d]/60 border border-slate-800 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid gap-4">
          {GRUPOS_META.map(meta => (
            <TablaGrupoEditable key={meta.grupo} meta={meta}
              paginas={paginas.filter(p => p.grupo === meta.grupo)}
              onReload={reloadPaginas} />
          ))}
        </div>
      )}

      <div className="rounded-xl border border-slate-800 p-4 bg-[#2a1b3d]/60">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={16} className="text-violet-400" />
          <h3 className="text-sm font-bold text-slate-100">Reglas de autoridad por nivel</h3>
        </div>
        {loadingReglas ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-8 rounded bg-slate-800 animate-pulse" />)}</div>
        ) : (
          <ListaReglasEditable reglas={reglas} onReload={reloadReglas} />
        )}
      </div>

      <p className="text-[11px] text-slate-500">
        Basado en la investigación real de búsqueda (Google Suggest + Google Ads Keyword Planner, México, 26-sep-2026):
        "anillos de compromiso" — 165,000 búsquedas/mes — es el término de mayor volumen de todo el catálogo, seguido de
        "argollas de matrimonio" (22,200) y "churumbela de oro" (6,600). Ver los posts del blog y las páginas de
        categoría/material/regalos para el detalle completo por término.
      </p>
    </SeccionVitrina>
  )
}
