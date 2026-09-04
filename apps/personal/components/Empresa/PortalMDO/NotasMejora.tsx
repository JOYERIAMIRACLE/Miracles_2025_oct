"use client"
import { useEffect, useRef, useState } from "react"
import { Pin, X, Check, Trash2, ListChecks, Pencil } from "lucide-react"
import { toast } from "sonner"
import { useCurrentUser } from "@/lib/useCurrentUser"
import { useGetNotasMejora } from "@/api/nota-mejora/getNotasMejora"
import { createNotaMejora, updateNotaMejora, deleteNotaMejora } from "@/api/nota-mejora/mutateNotasMejora"
import type { NotaMejoraType } from "@/types/nota-mejora"

function rutaActual(): string {
  if (typeof window === "undefined") return ""
  return window.location.pathname + window.location.hash
}

// Pin al que hay que hacer scroll tras navegar desde el CTA de una nota --
// se persiste en sessionStorage por si algún día irANota() necesita
// recargar la página completa (portales fuera de este, con rutas reales).
const SCROLL_TARGET_KEY = "mdo_nota_pin_destino"
function guardarPinDestino(documentId: string) {
  try { sessionStorage.setItem(SCROLL_TARGET_KEY, documentId) } catch {}
}
function leerPinDestino(): string | null {
  try { return sessionStorage.getItem(SCROLL_TARGET_KEY) } catch { return null }
}
function limpiarPinDestino() {
  try { sessionStorage.removeItem(SCROLL_TARGET_KEY) } catch {}
}

// "#portal/mision" -> "Portal › Mision" — sin diccionario de labels a
// propósito, solo para orientarse en la lista, no como texto final de producto.
function rutaLegible(ruta: string): string {
  const [path, hash] = ruta.split("#")
  const segmentos = [
    ...path.split("/").filter(Boolean).filter(s => s !== "portal-medalladeoro"),
    ...(hash ? hash.split("/").filter(Boolean) : []),
  ]
  if (segmentos.length === 0) return "Inicio"
  return segmentos.map(s => s.replace(/-/g, " ")).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" › ")
}

function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short" })
}

// Replica de components/Trabajo/portal/NotasMejora.tsx en sdi-portal,
// simplificada: este portal no tiene el sistema de roles granular de allá
// (ti/marketing ven todo, el resto solo lo suyo) -- aquí cualquier usuario
// logueado ve y gestiona todas las notas, sin distinción de admin (decisión
// tomada a propósito, no un recorte por falta de tiempo). Tampoco coordina
// con un chat bot (el ChatWidget de este proyecto está desactivado por
// ahora) -- si se reactiva, agregar el mismo mecanismo de "dina-chat-toggle"
// que usa sdi-portal para subir estos botones arriba del panel del bot.
export function NotasMejora({ onNavigate }: { onNavigate?: (id: string, tab?: string) => void }) {
  const { user } = useCurrentUser()
  const { notas, reload } = useGetNotasMejora()
  const [activo, setActivo] = useState(false)
  const [ruta, setRuta] = useState("")
  const [nuevo, setNuevo] = useState<{ x: number; y: number } | null>(null)
  const [texto, setTexto] = useState("")
  const [abierta, setAbierta] = useState<NotaMejoraType | null>(null)
  const [saving, setSaving] = useState(false)
  const [editandoTexto, setEditandoTexto] = useState(false)
  const [textoEdit, setTextoEdit] = useState("")
  const [editandoRespuesta, setEditandoRespuesta] = useState(false)
  const [respuestaEdit, setRespuestaEdit] = useState("")
  const [panelOpen, setPanelOpen] = useState(false)
  const [pinDestino, setPinDestino] = useState<string | null>(null)
  const [pinResaltado, setPinResaltado] = useState<string | null>(null)
  const [delConfirmId, setDelConfirmId] = useState<string | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setRuta(rutaActual())
    function onHash() { setRuta(rutaActual()) }
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])

  useEffect(() => {
    if (!panelOpen) return
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setPanelOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [panelOpen])

  // Si irANota() acaba de recargar la página completa, recupera el pin
  // objetivo pendiente y reactiva el modo pin para que el efecto de abajo
  // pueda encontrarlo y hacer scroll hasta él.
  useEffect(() => {
    const pendiente = leerPinDestino()
    if (pendiente) { setPinDestino(pendiente); setActivo(true) }
  }, [])

  // Hace scroll hasta el pin exacto (no solo la página) una vez que su
  // botón exista en el DOM — reintenta por rAF porque tras navegar la
  // sección puede tardar uno o más renders (y fetches) en montarse.
  useEffect(() => {
    if (!pinDestino) return
    let cancelado = false
    const limite = Date.now() + 5000
    function intentar() {
      if (cancelado) return
      const el = document.getElementById(`nota-pin-${pinDestino}`)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        setPinResaltado(pinDestino)
        setPinDestino(null)
        limpiarPinDestino()
        setTimeout(() => setPinResaltado(null), 2200)
        return
      }
      if (Date.now() < limite) requestAnimationFrame(intentar)
      else { setPinDestino(null); limpiarPinDestino() }
    }
    const raf = requestAnimationFrame(intentar)
    return () => { cancelado = true; cancelAnimationFrame(raf) }
  }, [pinDestino])

  const notasRuta = notas.filter(n => n.ruta === ruta)
  const pendientesTotal = notas.filter(n => n.estado === "pendiente").length
  const notasOrdenadas = [...notas].sort((a, b) => {
    if (a.estado !== b.estado) return a.estado === "pendiente" ? -1 : 1
    return b.createdAt.localeCompare(a.createdAt)
  })

  function irANota(n: NotaMejoraType) {
    guardarPinDestino(n.documentId)
    setPinDestino(n.documentId)
    const [path, hash] = n.ruta.split("#")
    if (onNavigate) {
      const [id, tab] = (hash ?? "").split("/")
      if (id) onNavigate(id, tab || undefined)
    } else if (path && path !== window.location.pathname) {
      window.location.href = n.ruta
    } else {
      window.location.hash = hash ?? ""
    }
    setPanelOpen(false)
    setAbierta(null)
    setNuevo(null)
    setActivo(true)
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!overlayRef.current) return
    const rect = overlayRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setNuevo({ x, y })
    setTexto("")
    setAbierta(null)
  }

  async function guardarNueva() {
    if (!nuevo || !texto.trim()) return
    setSaving(true)
    try {
      await createNotaMejora({
        texto: texto.trim(), ruta, x: nuevo.x, y: nuevo.y,
        autor_nombre: user?.username ?? undefined,
        estado: "pendiente",
      })
      toast.success("Nota agregada")
      setNuevo(null)
      setTexto("")
      reload()
    } catch (e) { toast.error(`Error al guardar · ${(e as Error).message}`) }
    finally { setSaving(false) }
  }

  async function alternarResuelta(n: NotaMejoraType) {
    try {
      await updateNotaMejora(n.documentId, { estado: n.estado === "pendiente" ? "resuelta" : "pendiente" })
      toast.success(n.estado === "pendiente" ? "Marcada como resuelta" : "Reabierta")
      setAbierta(null)
      reload()
    } catch (e) { toast.error(`Error · ${(e as Error).message}`) }
  }

  async function eliminar(n: NotaMejoraType) {
    try {
      await deleteNotaMejora(n.documentId)
      toast.success("Eliminada")
      setAbierta(null)
      reload()
    } catch (e) { toast.error(`Error · ${(e as Error).message}`) }
    finally { setDelConfirmId(null) }
  }

  function abrirNota(n: NotaMejoraType) {
    setAbierta(n)
    setNuevo(null)
    setEditandoTexto(false)
    setEditandoRespuesta(false)
  }

  function entrarEdicionTexto() {
    if (!abierta) return
    setTextoEdit(abierta.texto)
    setEditandoTexto(true)
  }

  async function guardarTexto() {
    if (!abierta || !textoEdit.trim()) return
    setSaving(true)
    try {
      const actualizado = await updateNotaMejora(abierta.documentId, { texto: textoEdit.trim() })
      setAbierta(actualizado)
      setEditandoTexto(false)
      reload()
    } catch (e) { toast.error(`Error al guardar · ${(e as Error).message}`) }
    finally { setSaving(false) }
  }

  function entrarEdicionRespuesta() {
    if (!abierta) return
    setRespuestaEdit(abierta.respuesta ?? "")
    setEditandoRespuesta(true)
  }

  async function guardarRespuesta() {
    if (!abierta) return
    setSaving(true)
    try {
      const actualizado = await updateNotaMejora(abierta.documentId, { respuesta: respuestaEdit.trim() })
      setAbierta(actualizado)
      setEditandoRespuesta(false)
      toast.success("Respuesta guardada")
      reload()
    } catch (e) { toast.error(`Error al guardar · ${(e as Error).message}`) }
    finally { setSaving(false) }
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
        <button type="button"
          onClick={() => { setActivo(v => !v); setNuevo(null); setAbierta(null); setPanelOpen(false) }}
          title={activo ? "Salir del modo desarrollador" : "Modo desarrollador — dejar notas de mejora"}
          className={`relative h-11 w-11 rounded-full shadow-lg flex items-center justify-center transition-colors ${
            activo
              ? "bg-orange-500 text-white"
              : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:text-orange-500"
          }`}>
          <Pin className="h-5 w-5" />
        </button>

        <button type="button"
          onClick={() => setPanelOpen(v => !v)}
          title="Ver todas las notas de mejora"
          className={`relative h-11 w-11 rounded-full shadow-lg flex items-center justify-center transition-colors ${
            panelOpen
              ? "bg-orange-500 text-white"
              : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:text-orange-500"
          }`}>
          <ListChecks className="h-5 w-5" />
          {pendientesTotal > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
              {pendientesTotal}
            </span>
          )}
        </button>
      </div>

      {panelOpen && (
        <div ref={panelRef}
          className="fixed bottom-[5.5rem] right-6 z-40 w-80 max-h-[70vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Notas de mejora {notas.length > 0 && <span className="text-slate-300 dark:text-slate-600">({notas.length})</span>}
            </p>
            <button type="button" onClick={() => setPanelOpen(false)}
              className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-300 transition">
              <X size={14} />
            </button>
          </div>
          {notasOrdenadas.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8 px-3">Sin notas de mejora todavía. Activa el modo desarrollador y haz clic en cualquier parte del portal para dejar la primera.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {notasOrdenadas.map(n => (
                <div key={n.documentId} onClick={() => irANota(n)}
                  className="flex items-start gap-2 px-3 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${n.estado === "resuelta" ? "bg-emerald-500" : "bg-orange-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug line-clamp-2 ${n.estado === "resuelta" ? "text-slate-400 dark:text-slate-500 line-through" : "text-slate-700 dark:text-slate-200"}`}>
                      {n.texto}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      {rutaLegible(n.ruta)} · {fechaCorta(n.createdAt)}{n.autor_nombre ? ` · ${n.autor_nombre}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {delConfirmId === n.documentId ? (
                      <span className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">¿Eliminar?</span>
                        <button type="button" onClick={() => eliminar(n)} className="text-[10px] text-red-500 dark:text-red-400 font-medium">Sí</button>
                        <button type="button" onClick={() => setDelConfirmId(null)} className="text-[10px] text-slate-400 dark:text-slate-500">No</button>
                      </span>
                    ) : (
                      <>
                        <button type="button" title={n.estado === "pendiente" ? "Marcar resuelta" : "Reabrir"}
                          onClick={e => { e.stopPropagation(); alternarResuelta(n) }}
                          className="p-1 text-slate-300 dark:text-slate-600 hover:text-orange-500 rounded transition">
                          <Check size={13} />
                        </button>
                        <button type="button" title="Eliminar"
                          onClick={e => { e.stopPropagation(); setDelConfirmId(n.documentId) }}
                          className="p-1 text-slate-300 dark:text-slate-600 hover:text-red-500 rounded transition">
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activo && (
        <div ref={overlayRef} onClick={handleOverlayClick}
          className="absolute inset-0 z-30" style={{ cursor: "crosshair" }}>
          {notasRuta.map(n => (
            <button key={n.documentId} id={`nota-pin-${n.documentId}`} type="button"
              onClick={e => { e.stopPropagation(); abrirNota(n) }}
              style={{ left: `${n.x}%`, top: `${n.y}%` }}
              title={n.texto}
              className={`absolute -translate-x-1/2 -translate-y-1/2 h-6 w-6 rounded-full border-2 border-white dark:border-slate-900 shadow flex items-center justify-center text-white transition-transform hover:scale-110 ${
                n.estado === "resuelta" ? "bg-emerald-500" : "bg-orange-500"
              } ${n.documentId === pinResaltado ? "scale-150 ring-4 ring-orange-300 dark:ring-orange-400/70 animate-pulse" : ""}`}>
              <Pin className="h-3 w-3" />
            </button>
          ))}

          {nuevo && (
            <div style={{ left: `clamp(9rem, ${nuevo.x}%, calc(100% - 9rem))`, top: `${nuevo.y}%` }}
              onClick={e => e.stopPropagation()}
              className="absolute z-40 w-72 -translate-x-1/2 mt-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 space-y-2">
              <textarea autoFocus rows={3} value={texto} onChange={e => setTexto(e.target.value)}
                placeholder="¿Qué se puede mejorar aquí?"
                className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-2 focus:outline-none focus:border-orange-400" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setNuevo(null)}
                  className="px-2.5 py-1.5 text-xs rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                  Cancelar
                </button>
                <button type="button" onClick={guardarNueva} disabled={saving || !texto.trim()}
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-semibold transition">
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          )}

          {abierta && (
            <div style={{ left: `clamp(9rem, ${abierta.x}%, calc(100% - 9rem))`, top: `${abierta.y}%` }}
              onClick={e => e.stopPropagation()}
              className="absolute z-40 w-72 -translate-x-1/2 mt-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                {editandoTexto ? (
                  <textarea autoFocus rows={3} value={textoEdit} onChange={e => setTextoEdit(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-2 focus:outline-none focus:border-orange-400" />
                ) : (
                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">{abierta.texto}</p>
                )}
                <div className="flex items-center gap-1 shrink-0">
                  {!editandoTexto && (
                    <button type="button" title="Editar" onClick={entrarEdicionTexto}
                      className="text-slate-300 dark:text-slate-600 hover:text-orange-500 transition">
                      <Pencil size={13} />
                    </button>
                  )}
                  <button type="button" onClick={() => setAbierta(null)}
                    className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-300 transition">
                    <X size={14} />
                  </button>
                </div>
              </div>
              {abierta.autor_nombre && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500">— {abierta.autor_nombre}</p>
              )}
              {editandoTexto && (
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setEditandoTexto(false)}
                    className="px-2.5 py-1.5 text-xs rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                    Cancelar
                  </button>
                  <button type="button" onClick={guardarTexto} disabled={saving || !textoEdit.trim()}
                    className="px-2.5 py-1.5 text-xs rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-semibold transition">
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Respuesta</p>
                {editandoRespuesta ? (
                  <>
                    <textarea autoFocus rows={2} value={respuestaEdit} onChange={e => setRespuestaEdit(e.target.value)}
                      placeholder="Escribe una respuesta o seguimiento..."
                      className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-2 focus:outline-none focus:border-orange-400" />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setEditandoRespuesta(false)}
                        className="px-2.5 py-1.5 text-xs rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        Cancelar
                      </button>
                      <button type="button" onClick={guardarRespuesta} disabled={saving}
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-semibold transition">
                        {saving ? "Guardando..." : "Guardar"}
                      </button>
                    </div>
                  </>
                ) : abierta.respuesta ? (
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{abierta.respuesta}</p>
                    <button type="button" title="Editar respuesta" onClick={entrarEdicionRespuesta}
                      className="text-slate-300 dark:text-slate-600 hover:text-orange-500 shrink-0 transition">
                      <Pencil size={12} />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={entrarEdicionRespuesta}
                    className="text-xs text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 transition">
                    + Agregar respuesta
                  </button>
                )}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                {delConfirmId === abierta.documentId ? (
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 dark:text-slate-500">¿Eliminar?</span>
                    <button type="button" onClick={() => eliminar(abierta)} className="text-xs text-red-500 dark:text-red-400 font-medium">Sí</button>
                    <button type="button" onClick={() => setDelConfirmId(null)} className="text-xs text-slate-400 dark:text-slate-500">No</button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setDelConfirmId(abierta.documentId)}
                    className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition">
                    <Trash2 size={12} /> Eliminar
                  </button>
                )}
                <button type="button" onClick={() => alternarResuelta(abierta)}
                  className="flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition">
                  <Check size={12} /> {abierta.estado === "pendiente" ? "Marcar resuelta" : "Reabrir"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
