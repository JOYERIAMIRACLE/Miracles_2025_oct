"use client"

import { useRef, useState } from "react"
import { Download, Trash2, Plus, X } from "lucide-react"
import { toast } from "sonner"
import { useGetRecursos } from "@/api/recurso/getRecursos"
import { createRecurso, deleteRecurso } from "@/api/recurso/mutateRecurso"
import { uploadMedia } from "@/lib/upload"
import { Card } from "./shared"

function getFileMeta(mime: string, ext: string) {
  if (mime === "application/pdf")
    return { grad: "from-red-400 to-red-600", label: "PDF" }
  if (mime.includes("presentationml") || mime.includes("powerpoint"))
    return { grad: "from-orange-400 to-orange-500", label: "PPT" }
  if (mime.includes("spreadsheetml") || mime.includes("excel"))
    return { grad: "from-emerald-400 to-emerald-600", label: "XLS" }
  if (mime.includes("wordprocessingml") || mime.includes("msword"))
    return { grad: "from-blue-400 to-blue-600", label: "DOC" }
  if (mime.startsWith("image/"))
    return { grad: "from-violet-400 to-violet-600", label: "IMG" }
  return { grad: "from-slate-400 to-slate-600", label: ext || "FILE" }
}

export function RecursosDescargables({ seccion }: { seccion: string }) {
  const { recursos, loading, reload } = useGetRecursos(seccion)
  const [subiendo, setSubiendo] = useState(false)
  const [eliminando, setEliminando] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSubiendo(true)
    try {
      const { id } = await uploadMedia(file)
      await createRecurso({ nombre: file.name.replace(/\.[^./]+$/, ""), archivo: id, seccion })
      reload()
      toast.success("Recurso subido")
    } catch (e) {
      toast.error(`Error al subir · ${(e as Error).message}`)
    } finally {
      setSubiendo(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  async function handleEliminar(documentId: string) {
    if (!window.confirm("¿Eliminar este recurso?")) return
    setEliminando(documentId)
    try { await deleteRecurso(documentId); reload(); toast.success("Eliminado") }
    catch (e) { toast.error(`Error · ${(e as Error).message}`) }
    finally { setEliminando(null) }
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Recursos descargables</p>
        <button type="button" onClick={() => inputRef.current?.click()} disabled={subiendo}
          className="flex items-center gap-1.5 text-[11px] text-violet-500 hover:text-violet-700 dark:hover:text-violet-400 font-semibold transition-colors disabled:opacity-50">
          <Plus size={12} /> {subiendo ? "Subiendo..." : "Subir archivo"}
        </button>
        <input ref={inputRef} type="file" className="hidden" onChange={handleArchivo} />
      </div>

      {loading && <p className="text-xs text-slate-400 text-center py-6">Cargando...</p>}
      {!loading && recursos.length === 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">Sin recursos todavía. Sube el primero.</p>
      )}
      {!loading && recursos.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {recursos.map(r => {
            const mime = r.archivo?.mime ?? ""
            const ext  = (r.archivo?.ext ?? r.archivo?.name?.split(".").pop() ?? "").replace(".", "").toUpperCase()
            const { grad, label } = getFileMeta(mime, ext)
            return (
              <div key={r.documentId} className="group flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-900">
                <div className={`shrink-0 h-9 w-9 rounded-lg bg-linear-to-br ${grad} flex items-center justify-center text-white text-[9px] font-black`}>
                  {label}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{r.nombre}</p>
                  {r.descripcion && <p className="text-[10px] text-slate-400 truncate">{r.descripcion}</p>}
                </div>
                {r.archivo?.url && (
                  <a href={r.archivo.url} download target="_blank" rel="noopener noreferrer"
                    className="shrink-0 h-7 w-7 flex items-center justify-center rounded-md text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors">
                    <Download className="h-3.5 w-3.5" />
                  </a>
                )}
                <button type="button" onClick={() => handleEliminar(r.documentId)} disabled={eliminando === r.documentId}
                  className="shrink-0 h-7 w-7 flex items-center justify-center rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100">
                  {eliminando === r.documentId ? <X className="h-3.5 w-3.5 animate-pulse" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
