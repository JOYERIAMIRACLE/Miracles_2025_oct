"use client"

import { useState } from "react"
import { Loader2, Camera, MapPin, Phone, Mail, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Card, SeccionHero, useHeroImagen, useUploadImagen, boldify } from "./shared"
import { useGetIdentidad, saveIdentidad } from "@/api/identidad-empresa/getIdentidad"

// ── Bloque "¿Quiénes somos?" — nombre + slogan en un mismo mini-formulario,
// mismo patrón de lápiz-al-hover que ya usa SeccionHero para su descripción.
function BloqueQuienesSomos({ nombre, slogan, documentId, reload }: {
  nombre: string; slogan: string; documentId: string | null; reload: () => void
}) {
  const [editando, setEditando] = useState(false)
  const [nombreB, setNombreB]   = useState(nombre)
  const [sloganB, setSloganB]   = useState(slogan)
  const [guardando, setGuardando] = useState(false)

  function entrar() { setNombreB(nombre); setSloganB(slogan); setEditando(true) }
  async function guardar() {
    setGuardando(true)
    try {
      await saveIdentidad(documentId, { nombre: nombreB.trim() || null, slogan: sloganB.trim() || null })
      setEditando(false)
      reload()
    } catch (e) {
      toast.error(`Error · ${(e as Error).message}`)
    } finally { setGuardando(false) }
  }

  return (
    <div className="group/bloque">
      <div className="flex items-center gap-1.5">
        <h2 className="text-xl font-bold text-violet-600 dark:text-violet-400">¿Quiénes somos?</h2>
        {!editando && (
          <button type="button" title="Editar ¿Quiénes somos?" onClick={entrar}
            className="opacity-0 group-hover/bloque:opacity-100 text-slate-400 hover:text-violet-500 transition">
            <Pencil size={13} />
          </button>
        )}
      </div>
      {editando ? (
        <div className="space-y-2 mt-1.5">
          <input autoFocus value={nombreB} onChange={e => setNombreB(e.target.value)} placeholder="Nombre"
            className="w-full h-8 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-violet-400" />
          <input value={sloganB} onChange={e => setSloganB(e.target.value)} placeholder="Slogan"
            className="w-full h-8 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-violet-400" />
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditando(false)}
              className="px-2.5 py-1 text-xs rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              Cancelar
            </button>
            <button type="button" onClick={guardar} disabled={guardando}
              className="px-2.5 py-1 text-xs rounded-lg bg-violet-500 hover:bg-violet-600 disabled:opacity-40 text-white font-semibold transition">
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {nombre}{slogan ? ` — ${slogan}` : ""}
        </p>
      )}
    </div>
  )
}

// ── Bloque Misión / Visión — un solo textarea, mismo patrón.
function BloqueMisionVision({ titulo, valor, campo, documentId, reload }: {
  titulo: string; valor: string; campo: "mision" | "vision"; documentId: string | null; reload: () => void
}) {
  const [editando, setEditando] = useState(false)
  const [borrador, setBorrador] = useState(valor)
  const [guardando, setGuardando] = useState(false)

  function entrar() { setBorrador(valor); setEditando(true) }
  async function guardar() {
    setGuardando(true)
    try {
      await saveIdentidad(documentId, { [campo]: borrador.trim() || null })
      setEditando(false)
      reload()
    } catch (e) {
      toast.error(`Error · ${(e as Error).message}`)
    } finally { setGuardando(false) }
  }

  return (
    <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-1 group/bloque">
      <div className="flex items-center gap-1.5 mb-1.5">
        <h3 className="text-xl font-bold text-violet-600 dark:text-violet-400">{titulo}</h3>
        {!editando && (
          <button type="button" title={`Editar ${titulo}`} onClick={entrar}
            className="opacity-0 group-hover/bloque:opacity-100 text-slate-400 hover:text-violet-500 transition">
            <Pencil size={13} />
          </button>
        )}
      </div>
      {editando ? (
        <div className="space-y-2">
          <textarea autoFocus rows={3} value={borrador} onChange={e => setBorrador(e.target.value)}
            className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-violet-400" />
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditando(false)}
              className="px-2.5 py-1 text-xs rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              Cancelar
            </button>
            <button type="button" onClick={guardar} disabled={guardando}
              className="px-2.5 py-1 text-xs rounded-lg bg-violet-500 hover:bg-violet-600 disabled:opacity-40 text-white font-semibold transition">
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      ) : valor ? (
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{boldify(valor)}</p>
      ) : (
        <p className="text-sm text-slate-400 dark:text-slate-500 italic">Pendiente de definir</p>
      )}
    </div>
  )
}

function TabQuienesSomos() {
  const { identidad, loading, reload } = useGetIdentidad()
  const documentId = identidad?.documentId ?? null
  const puedeEditar = true

  const [popupImg, setPopupImg] = useState<string | null>(null)
  const fotoImg    = useUploadImagen("foto_equipo",   documentId, reload)
  const misionImg  = useUploadImagen("imagen_mision", documentId, reload)
  const visionImg  = useUploadImagen("imagen_vision", documentId, reload)

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-500" size={20} /></div>

  return (
    <div className="space-y-4">
      {/* ── BLOQUE UNIFICADO empresa + misión + visión ─────── */}
      <Card className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-1.5! overflow-hidden">
        <div className="p-6 flex flex-col gap-3">
          <BloqueQuienesSomos
            nombre={identidad?.nombre ?? "Medallitadeoro"} slogan={identidad?.slogan ?? ""}
            documentId={documentId} reload={reload} />
          <BloqueMisionVision titulo="Misión" campo="mision" valor={identidad?.mision ?? ""}
            documentId={documentId} reload={reload} />
          <BloqueMisionVision titulo="Visión" campo="vision" valor={identidad?.vision ?? ""}
            documentId={documentId} reload={reload} />
        </div>

        <div className="relative min-h-[260px] rounded-xl overflow-hidden group cursor-pointer bg-violet-600"
          onClick={() => identidad?.foto_equipo?.url && setPopupImg(identidad.foto_equipo.url)}>
          {identidad?.foto_equipo?.url
            ? <img src={identidad.foto_equipo.url} alt="Equipo Medallitadeoro" className="absolute inset-0 w-full h-full object-cover object-top" />
            : <div className="min-h-[200px] h-full flex flex-col items-center justify-center text-white select-none px-4">
                <div className="text-5xl font-bold opacity-30">MDO</div>
                <div className="text-xs mt-2 opacity-60 text-center">Foto del equipo · Pendiente</div>
              </div>
          }
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2">
            {identidad?.foto_equipo?.url && (
              <span className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-white/90 text-slate-800 text-xs font-semibold rounded-lg">Ver foto</span>
            )}
            {puedeEditar && (
              <button type="button" onClick={e => { e.stopPropagation(); fotoImg.trigger() }} disabled={fotoImg.uploading}
                className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-3 py-1.5 bg-white/90 hover:bg-white text-slate-800 text-xs font-semibold rounded-lg disabled:opacity-50">
                <Camera className="h-3.5 w-3.5" />{fotoImg.uploading ? "Subiendo…" : "Cambiar"}
              </button>
            )}
          </div>
          <input ref={fotoImg.inputRef} type="file" accept="image/*" onChange={fotoImg.handleFile} className="hidden" />
        </div>
      </Card>

      {/* ── IMÁGENES misión / visión ─────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {([
          { campo: "imagen_mision", label: "Misión",  emoji: "🎯", url: identidad?.imagen_mision?.url, hook: misionImg },
          { campo: "imagen_vision", label: "Visión",  emoji: "🏆", url: identidad?.imagen_vision?.url, hook: visionImg },
        ] as const).map(b => (
          <div key={b.campo} className="relative group cursor-pointer rounded-xl overflow-hidden shadow-sm bg-slate-100 dark:bg-slate-800"
            onClick={() => b.url && setPopupImg(b.url)}>
            {b.url
              ? <img src={b.url} alt={b.label} className="w-full h-auto block" />
              : <div className="h-48 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 select-none">
                  <div className="text-3xl mb-2">{b.emoji}</div>
                  <div className="text-xs">Imagen de {b.label} · Pendiente</div>
                </div>
            }
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2">
              {b.url && <span className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-white/90 text-slate-800 text-xs font-semibold rounded-lg">Ver imagen</span>}
              {puedeEditar && (
                <button type="button" onClick={e => { e.stopPropagation(); b.hook.trigger() }} disabled={b.hook.uploading}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-3 py-1.5 bg-white/90 hover:bg-white text-slate-800 text-xs font-semibold rounded-lg disabled:opacity-50">
                  <Camera className="h-3.5 w-3.5" />{b.hook.uploading ? "Subiendo…" : "Cambiar"}
                </button>
              )}
            </div>
            <input ref={b.hook.inputRef} type="file" accept="image/*" onChange={b.hook.handleFile} className="hidden" />
          </div>
        ))}
      </div>

      {/* ── OFICINA ───────────────────────────────────────── */}
      <Card className="flex gap-4 items-start">
        <div className="h-9 w-9 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900 flex items-center justify-center shrink-0">
          <MapPin className="h-4 w-4 text-violet-500" />
        </div>
        <div>
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1">Oficina</h4>
          {identidad?.direccion
            ? <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line">{identidad.direccion}</p>
            : <p className="text-sm text-slate-400 dark:text-slate-500 italic">Dirección pendiente de definir</p>}
        </div>
      </Card>

      {/* ── CONTACTO ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {([
          { icon: Phone, label: "Teléfono", valor: identidad?.telefono, href: identidad?.telefono ? `tel:${identidad.telefono}` : undefined },
          { icon: Mail,  label: "Correo",   valor: identidad?.correo,   href: identidad?.correo ? `mailto:${identidad.correo}` : undefined },
        ] as const).map(({ icon: Icon, label, valor, href }) => {
          const contenido = (
            <>
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-violet-50 dark:group-hover:bg-violet-950/30 transition-colors">
                <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-violet-500 transition-colors" />
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 break-all group-hover:text-violet-600 transition-colors">
                {valor ?? "Pendiente"}
              </div>
            </>
          )
          const cls = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:border-violet-300 hover:shadow-md transition-all group"
          return href
            ? <a key={label} href={href} className={cls}>{contenido}</a>
            : <div key={label} className={cls}>{contenido}</div>
        })}
      </div>

      {popupImg && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setPopupImg(null)}>
          <div className="relative max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setPopupImg(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm font-semibold flex items-center gap-1">
              ✕ Cerrar
            </button>
            <img src={popupImg} alt="Vista completa" className="w-full h-auto rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  )
}

export function SeccionConoceMDO() {
  const { identidad, loading, reload } = useGetIdentidad()
  const hero = useHeroImagen("portada_conoce", identidad?.documentId ?? null, reload)

  return (
    <div className="space-y-4">
      <SeccionHero
        breadcrumb={["Conoce a Medallitadeoro", "¿Quiénes somos?"]}
        titulo="Conoce a Medallitadeoro"
        descripcion={identidad?.descripcion_conoce || "Historia, propósito, visión y equipo de Joyería Miracles — todo lo que necesitas saber sobre medallitadeoro."}
        campoDescripcion="descripcion_conoce"
        onDescripcionGuardada={reload}
        imagenUrl={identidad?.portada_conoce?.url}
        imagenOriginalUrl={identidad?.portada_conoce_original?.url}
        documentId={identidad?.documentId ?? null}
        puedeEditar={!loading}
        uploading={hero.uploading}
        inputRef={hero.inputRef}
        onTrigger={hero.trigger}
        onFileChange={hero.handleFile}
        onSaveCrop={hero.saveCrop}
      />
      <TabQuienesSomos />
    </div>
  )
}
