"use client"

import { useState, useEffect } from "react"
import { Loader2, Save, Building2 } from "lucide-react"
import { toast } from "sonner"
import { useGetIdentidad, saveIdentidad } from "@/api/identidad-empresa/getIdentidad"
import { IdentidadPayload } from "@/types/identidad-empresa"

const inp  = "w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all"
const area = inp + " resize-none"

function empty(): IdentidadPayload {
  return {
    nombre: null, slogan: null, mision: null, vision: null,
    valores: null, colores: null, tipografia: null,
    sitioWeb: null, redesSociales: null, notas: null,
  }
}

export function IdentidadView() {
  const { identidad, setIdentidad, loading } = useGetIdentidad()
  const [form,   setForm]   = useState<IdentidadPayload>(empty())
  const [saving, setSaving] = useState(false)
  const [dirty,  setDirty]  = useState(false)

  useEffect(() => {
    if (identidad) {
      setForm({
        nombre: identidad.nombre, slogan: identidad.slogan,
        mision: identidad.mision, vision: identidad.vision,
        valores: identidad.valores, colores: identidad.colores,
        tipografia: identidad.tipografia, sitioWeb: identidad.sitioWeb,
        redesSociales: identidad.redesSociales, notas: identidad.notas,
      })
    }
  }, [identidad])

  function set(key: keyof IdentidadPayload, value: string) {
    setForm(f => ({ ...f, [key]: value || null }))
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const saved = await saveIdentidad(identidad?.documentId ?? null, form)
      setIdentidad(saved)
      setDirty(false)
      toast.success("Identidad guardada")
    } catch {
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="p-6 flex items-center gap-2 text-slate-500 text-sm">
      <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
    </div>
  )

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Identidad Corporativa</h1>
            <p className="text-xs text-slate-500">Misión, visión, valores y marca de la empresa</p>
          </div>
        </div>
        <button type="button" onClick={handleSave} disabled={saving || !dirty}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-40 transition-colors">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar
        </button>
      </div>

      {/* Sección: Datos generales */}
      <Section title="Datos generales">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre de la empresa">
            <input type="text" placeholder="Ej. Miracles Joyería" value={form.nombre ?? ""}
              onChange={e => set("nombre", e.target.value)} className={inp} />
          </Field>
          <Field label="Slogan">
            <input type="text" placeholder="Ej. Tu joya, tu historia" value={form.slogan ?? ""}
              onChange={e => set("slogan", e.target.value)} className={inp} />
          </Field>
          <Field label="Sitio web">
            <input type="url" placeholder="https://..." value={form.sitioWeb ?? ""}
              onChange={e => set("sitioWeb", e.target.value)} className={inp} />
          </Field>
          <Field label="Tipografía">
            <input type="text" placeholder="Ej. Playfair Display, Inter" value={form.tipografia ?? ""}
              onChange={e => set("tipografia", e.target.value)} className={inp} />
          </Field>
        </div>
        <Field label="Colores de marca (hex o nombres)">
          <input type="text" placeholder="Ej. #1a1a2e, #e8c97e, #ffffff" value={form.colores ?? ""}
            onChange={e => set("colores", e.target.value)} className={inp} />
        </Field>
      </Section>

      {/* Sección: Filosofía */}
      <Section title="Filosofía empresarial">
        <Field label="Misión">
          <textarea rows={3} placeholder="¿Por qué existimos? ¿Qué problema resolvemos?" value={form.mision ?? ""}
            onChange={e => set("mision", e.target.value)} className={area} />
        </Field>
        <Field label="Visión">
          <textarea rows={3} placeholder="¿A dónde queremos llegar en el futuro?" value={form.vision ?? ""}
            onChange={e => set("vision", e.target.value)} className={area} />
        </Field>
        <Field label="Valores">
          <textarea rows={3} placeholder="Ej. Confianza, calidad, cercanía, originalidad" value={form.valores ?? ""}
            onChange={e => set("valores", e.target.value)} className={area} />
        </Field>
      </Section>

      {/* Sección: Digital */}
      <Section title="Presencia digital">
        <Field label="Redes sociales">
          <textarea rows={3} placeholder="Ej. Instagram: @miraclesjoyeria | Facebook: MiraclesJoyeria" value={form.redesSociales ?? ""}
            onChange={e => set("redesSociales", e.target.value)} className={area} />
        </Field>
        <Field label="Notas internas">
          <textarea rows={2} placeholder="Guía de voz, tono, observaciones de marca…" value={form.notas ?? ""}
            onChange={e => set("notas", e.target.value)} className={area} />
        </Field>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{title}</h2>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium text-slate-400">{label}</label>
      {children}
    </div>
  )
}
